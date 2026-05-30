import { EstadoOrdenCompra, Prisma, TipoMovimiento } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { createAuditLog } from "../../lib/audit.js";
import { AppError, asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";

export const comprasRouter = Router();

const toDecimal = (value: number) => new Prisma.Decimal(value);

const ordenCompraSchema = z.object({
  numero: z.string().min(2),
  proveedorId: z.string().uuid(),
  fechaEmision: z.string(),
  detalles: z
    .array(
      z.object({
        productoId: z.string().uuid(),
        cantidad: z.number().positive(),
        precioUnitario: z.number().nonnegative().optional()
      })
    )
    .min(1)
});

const recepcionSchema = z.object({
  ordenCompraId: z.string().uuid(),
  observaciones: z.string().optional(),
  items: z
    .array(
      z.object({
        productoId: z.string().uuid(),
        ubicacionId: z.string().uuid(),
        cantidadEsperada: z.number().positive(),
        cantidadRecibida: z.number().nonnegative()
      })
    )
    .min(1)
});

comprasRouter.use(requireAuth);

comprasRouter.get(
  "/ordenes",
  asyncHandler(async (_req, res) => {
    const ordenes = await prisma.ordenCompra.findMany({
      include: {
        proveedor: true,
        detalles: {
          include: {
            producto: true
          }
        },
        recepciones: true
      },
      orderBy: { fechaEmision: "desc" }
    });

    res.json(ordenes);
  })
);

comprasRouter.post(
  "/ordenes",
  requirePermission("Compras"),
  asyncHandler(async (req, res) => {
    const data = ordenCompraSchema.parse(req.body);
    const orden = await prisma.ordenCompra.create({
      data: {
        numero: data.numero,
        proveedorId: data.proveedorId,
        fechaEmision: new Date(data.fechaEmision),
        estado: EstadoOrdenCompra.PENDIENTE,
        usuarioId: req.user!.id,
        detalles: {
          create: data.detalles.map((detalle) => ({
            productoId: detalle.productoId,
            cantidad: toDecimal(detalle.cantidad),
            precioUnitario:
              typeof detalle.precioUnitario === "number"
                ? toDecimal(detalle.precioUnitario)
                : undefined
          }))
        }
      },
      include: {
        detalles: true
      }
    });

    await createAuditLog({
      req,
      accion: "ORDEN_COMPRA_CREADA",
      metadata: { ordenCompraId: orden.id, numero: orden.numero }
    });

    res.status(201).json(orden);
  })
);

comprasRouter.post(
  "/recepciones",
  requirePermission("Recepciones"),
  asyncHandler(async (req, res) => {
    const data = recepcionSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const orden = await tx.ordenCompra.findUnique({
        where: { id: data.ordenCompraId },
        include: { detalles: true }
      });

      if (!orden) {
        throw new AppError("Orden de compra no encontrada", 404);
      }

      const recepcion = await tx.recepcion.create({
        data: {
          ordenCompraId: data.ordenCompraId,
          usuarioId: req.user!.id,
          observaciones: data.observaciones,
          detalles: {
            create: data.items.map((item) => ({
              productoId: item.productoId,
              ubicacionId: item.ubicacionId,
              cantidadEsperada: toDecimal(item.cantidadEsperada),
              cantidadRecibida: toDecimal(item.cantidadRecibida)
            }))
          }
        },
        include: {
          detalles: true
        }
      });

      for (const item of data.items) {
        const existing = await tx.inventario.findFirst({
          where: {
            productoId: item.productoId,
            ubicacionId: item.ubicacionId
          }
        });

        const nuevaCantidad = (existing ? Number(existing.cantidad) : 0) + item.cantidadRecibida;

        if (existing) {
          await tx.inventario.update({
            where: { id: existing.id },
            data: {
              cantidad: toDecimal(nuevaCantidad),
              fechaAct: new Date()
            }
          });
        } else {
          await tx.inventario.create({
            data: {
              productoId: item.productoId,
              ubicacionId: item.ubicacionId,
              cantidad: toDecimal(item.cantidadRecibida)
            }
          });
        }

        await tx.ubicacion.update({
          where: { id: item.ubicacionId },
          data: { ocupada: nuevaCantidad > 0 }
        });

        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimiento.ENTRADA,
            productoId: item.productoId,
            cantidad: toDecimal(item.cantidadRecibida),
            usuarioId: req.user!.id,
            referencia: `RECEPCION:${recepcion.id}`
          }
        });
      }

      const completos = data.items.every((item) => item.cantidadRecibida >= item.cantidadEsperada);

      await tx.ordenCompra.update({
        where: { id: orden.id },
        data: {
          estado: completos ? EstadoOrdenCompra.COMPLETA : EstadoOrdenCompra.PARCIAL
        }
      });

      return recepcion;
    });

    await createAuditLog({
      req,
      accion: "RECEPCION_REGISTRADA",
      metadata: { recepcionId: result.id, ordenCompraId: data.ordenCompraId }
    });

    res.status(201).json(result);
  })
);
