import { EstadoOrdenDespacho, Prisma, TipoMovimiento } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { createAuditLog } from "../../lib/audit.js";
import { AppError, asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";

export const despachosRouter = Router();

const toDecimal = (value: number) => new Prisma.Decimal(value);

const enrichOrdersWithReturnData = (orders: any[]) =>
  orders.map((order) => {
    const returnedByDetail = Object.fromEntries(
      order.detalles.map((detail: any) => {
        const total = (detail.devoluciones || []).reduce((sum: number, item: any) => sum + Number(item.cantidad), 0);
        return [detail.id, total];
      })
    );

    return {
      ...order,
      detalles: order.detalles.map((detail: any) => ({
        ...detail,
        cantidadDevuelta: returnedByDetail[detail.id] || 0,
        cantidadDisponibleDevolucion: Math.max(Number(detail.cantidad) - (returnedByDetail[detail.id] || 0), 0)
      })),
      devoluciones: (order.devoluciones || []).map((devolucion: any) => ({
        ...devolucion,
        totalItems: devolucion.detalles.reduce((sum: number, item: any) => sum + Number(item.cantidad), 0)
      }))
    };
  });

const ordenDespachoSchema = z.object({
  numero: z.string().min(2),
  clienteId: z.string().uuid(),
  fechaRequerida: z.string(),
  detalles: z
    .array(
      z.object({
        productoId: z.string().uuid(),
        ubicacionId: z.string().uuid(),
        cantidad: z.number().positive()
      })
    )
    .min(1)
});

const devolucionSchema = z.object({
  motivo: z.string().min(5),
  items: z
    .array(
      z.object({
        detalleId: z.string().uuid(),
        cantidad: z.number().positive()
      })
    )
    .min(1)
});

despachosRouter.use(requireAuth);

despachosRouter.get(
  "/ordenes",
  asyncHandler(async (_req, res) => {
    const ordenes = await prisma.ordenDespacho.findMany({
      include: {
        clienteData: true,
        detalles: {
          include: {
            producto: true,
            ubicacion: true,
            devoluciones: true
          }
        },
        devoluciones: {
          include: {
            usuario: {
              select: { id: true, nombre: true, email: true, rol: true }
            },
            detalles: {
              include: {
                detalleDespacho: {
                  include: {
                    producto: true,
                    ubicacion: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(enrichOrdersWithReturnData(ordenes));
  })
);

despachosRouter.post(
  "/ordenes",
  requirePermission("Despachos"),
  asyncHandler(async (req, res) => {
    const data = ordenDespachoSchema.parse(req.body);
    const cliente = await prisma.cliente.findUnique({
      where: { id: data.clienteId }
    });

    if (!cliente || !cliente.activo) {
      throw new AppError("Cliente no encontrado", 404);
    }

    const orden = await prisma.ordenDespacho.create({
      data: {
        numero: data.numero,
        cliente: cliente.nombre,
        clienteId: cliente.id,
        fechaRequerida: new Date(data.fechaRequerida),
        estado: EstadoOrdenDespacho.PENDIENTE,
        usuarioId: req.user!.id,
        detalles: {
          create: data.detalles.map((detalle) => ({
            productoId: detalle.productoId,
            ubicacionId: detalle.ubicacionId,
            cantidad: toDecimal(detalle.cantidad)
          }))
        }
      },
      include: {
        detalles: true
      }
    });

    await createAuditLog({
      req,
      accion: "ORDEN_DESPACHO_CREADA",
      metadata: { ordenDespachoId: orden.id, numero: orden.numero }
    });

    res.status(201).json(orden);
  })
);

despachosRouter.post(
  "/:id/generar-picking",
  requirePermission("Picking"),
  asyncHandler(async (req, res) => {
    const ordenId = String(req.params.id);
    const currentOrder = await prisma.ordenDespacho.findUnique({
      where: { id: ordenId }
    });

    if (!currentOrder) {
      throw new AppError("Orden de despacho no encontrada", 404);
    }

    if (currentOrder.estado === EstadoOrdenDespacho.DESPACHADA) {
      throw new AppError("La orden ya fue despachada y no puede volver a picking", 400);
    }

    const orden = await prisma.ordenDespacho.update({
      where: { id: ordenId },
      data: { estado: EstadoOrdenDespacho.EN_PICKING },
      include: {
        detalles: {
          include: {
            producto: true,
            ubicacion: true
          }
        }
      }
    });

    await createAuditLog({
      req,
      accion: "PICKING_GENERADO",
      metadata: { ordenDespachoId: orden.id }
    });

    const picking = [...orden.detalles].sort((a, b) => a.ubicacion.codigo.localeCompare(b.ubicacion.codigo));

    res.json({
      ordenId: orden.id,
      numero: orden.numero,
      picking
    });
  })
);

despachosRouter.post(
  "/:id/finalizar",
  requirePermission("Despachos", "Picking"),
  asyncHandler(async (req, res) => {
    const ordenId = String(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const orden = await tx.ordenDespacho.findUnique({
        where: { id: ordenId },
        include: { detalles: true }
      });

      if (!orden) {
        throw new AppError("Orden de despacho no encontrada", 404);
      }

      if (orden.estado === EstadoOrdenDespacho.PENDIENTE) {
        throw new AppError("Debes generar el picking antes de completar el despacho", 400);
      }

      if (orden.estado !== EstadoOrdenDespacho.EN_PICKING) {
        throw new AppError("La orden no está en un estado válido para completar el despacho", 400);
      }

      for (const detalle of orden.detalles) {
        const inventario = await tx.inventario.findFirst({
          where: {
            productoId: detalle.productoId,
            ubicacionId: detalle.ubicacionId
          }
        });

        const cantidadSalida = Number(detalle.cantidad);

        if (!inventario || Number(inventario.cantidad) < cantidadSalida) {
          throw new AppError("Stock insuficiente para completar el despacho", 400);
        }

        const restante = Number(inventario.cantidad) - cantidadSalida;

        await tx.inventario.update({
          where: { id: inventario.id },
          data: {
            cantidad: toDecimal(restante),
            fechaAct: new Date()
          }
        });

        await tx.ubicacion.update({
          where: { id: detalle.ubicacionId },
          data: { ocupada: restante > 0 }
        });

        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimiento.SALIDA,
            productoId: detalle.productoId,
            cantidad: detalle.cantidad,
            usuarioId: req.user!.id,
            referencia: `DESPACHO:${orden.id}`
          }
        });
      }

      return tx.ordenDespacho.update({
        where: { id: ordenId },
        data: { estado: EstadoOrdenDespacho.DESPACHADA },
        include: {
          detalles: {
            include: {
              producto: true,
              ubicacion: true
            }
          }
        }
      });
    });

    await createAuditLog({
      req,
      accion: "DESPACHO_FINALIZADO",
      metadata: { ordenDespachoId: result.id }
    });

    res.json(result);
  })
);

despachosRouter.post(
  "/:id/devolucion",
  requirePermission("Despachos"),
  asyncHandler(async (req, res) => {
    const ordenId = String(req.params.id);
    const data = devolucionSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const orden = await tx.ordenDespacho.findUnique({
        where: { id: ordenId },
        include: {
          detalles: {
            include: {
              producto: true,
              ubicacion: true,
              devoluciones: true
            }
          }
        }
      });

      if (!orden) {
        throw new AppError("Orden de despacho no encontrada", 404);
      }

      if (orden.estado !== EstadoOrdenDespacho.DESPACHADA) {
        throw new AppError("Solo se pueden registrar devoluciones de despachos finalizados", 400);
      }

      const devolucion = await tx.devolucionDespacho.create({
        data: {
          ordenDespachoId: orden.id,
          usuarioId: req.user!.id,
          motivo: data.motivo
        }
      });

      const processedItems = [];

      for (const item of data.items) {
        const detalle = orden.detalles.find((detail) => detail.id === item.detalleId);

        if (!detalle) {
          throw new AppError("Detalle de despacho no encontrado", 404);
        }

        const returnedQuantity = (detalle.devoluciones || []).reduce((sum, movement) => sum + Number(movement.cantidad), 0);
        const maxReturnable = Number(detalle.cantidad) - returnedQuantity;

        if (item.cantidad > maxReturnable) {
          throw new AppError(`La devolucion excede lo disponible para ${detalle.producto.nombre}`, 400);
        }

        const inventario = await tx.inventario.findFirst({
          where: {
            productoId: detalle.productoId,
            ubicacionId: detalle.ubicacionId
          }
        });

        const nuevaCantidad = (inventario ? Number(inventario.cantidad) : 0) + item.cantidad;

        if (inventario) {
          await tx.inventario.update({
            where: { id: inventario.id },
            data: {
              cantidad: toDecimal(nuevaCantidad),
              fechaAct: new Date()
            }
          });
        } else {
          await tx.inventario.create({
            data: {
              productoId: detalle.productoId,
              ubicacionId: detalle.ubicacionId,
              cantidad: toDecimal(item.cantidad)
            }
          });
        }

        await tx.ubicacion.update({
          where: { id: detalle.ubicacionId },
          data: { ocupada: nuevaCantidad > 0 }
        });

        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimiento.ENTRADA,
            productoId: detalle.productoId,
            cantidad: toDecimal(item.cantidad),
            usuarioId: req.user!.id,
            referencia: `DEVOLUCION:${orden.id}:${detalle.id}`
          }
        });

        await tx.detalleDevolucionDespacho.create({
          data: {
            devolucionId: devolucion.id,
            detalleDespachoId: detalle.id,
            cantidad: toDecimal(item.cantidad)
          }
        });

        processedItems.push({
          detalleId: detalle.id,
          producto: detalle.producto.nombre,
          ubicacion: detalle.ubicacion.codigo,
          cantidadDevuelta: item.cantidad,
          motivo: data.motivo
        });
      }

      return {
        devolucionId: devolucion.id,
        ordenId: orden.id,
        numero: orden.numero,
        motivo: devolucion.motivo,
        createdAt: devolucion.createdAt,
        items: processedItems
      };
    });

    await createAuditLog({
      req,
      accion: "DEVOLUCION_REGISTRADA",
      metadata: {
        ordenDespachoId: result.ordenId,
        numero: result.numero,
        devolucionId: result.devolucionId,
        motivo: result.motivo,
        items: result.items
      }
    });

    res.status(201).json(result);
  })
);
