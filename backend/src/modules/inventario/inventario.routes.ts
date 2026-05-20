import { Router } from "express";
import { Prisma, TipoMovimiento } from "@prisma/client";
import { z } from "zod";

import { AppError, asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";

export const inventarioRouter = Router();

const movimientoEntradaSchema = z.object({
  productoId: z.string().uuid(),
  ubicacionId: z.string().uuid(),
  cantidad: z.number().positive(),
  referencia: z.string().optional()
});

const movimientoSalidaSchema = z.object({
  productoId: z.string().uuid(),
  ubicacionId: z.string().uuid(),
  cantidad: z.number().positive(),
  referencia: z.string().optional()
});

const ajusteSchema = z.object({
  productoId: z.string().uuid(),
  ubicacionId: z.string().uuid(),
  nuevaCantidad: z.number().min(0),
  motivo: z.string().min(5)
});

const toDecimal = (value: number) => new Prisma.Decimal(value);

inventarioRouter.use(requireAuth);

inventarioRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const inventario = await prisma.inventario.findMany({
      include: {
        producto: {
          include: { categoria: true }
        },
        ubicacion: true
      },
      orderBy: { fechaAct: "desc" }
    });

    const lowStock = inventario.filter((item) => Number(item.cantidad) <= item.producto.stockMinimo);

    res.json({
      items: inventario,
      metrics: {
        totalRegistros: inventario.length,
        alertasStockMinimo: lowStock.length
      }
    });
  })
);

inventarioRouter.get(
  "/movimientos",
  asyncHandler(async (_req, res) => {
    const movimientos = await prisma.movimientoInventario.findMany({
      include: {
        producto: true,
        usuario: {
          select: { id: true, nombre: true, email: true, rol: true }
        }
      },
      orderBy: { fecha: "desc" },
      take: 100
    });

    res.json(movimientos);
  })
);

inventarioRouter.post(
  "/entrada",
  requirePermission("Inventario", "Ajustes operativos"),
  asyncHandler(async (req, res) => {
    const data = movimientoEntradaSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventario.findFirst({
        where: {
          productoId: data.productoId,
          ubicacionId: data.ubicacionId
        }
      });

      const cantidadActual = existing ? Number(existing.cantidad) : 0;
      const nuevaCantidad = cantidadActual + data.cantidad;

      const inventario = existing
        ? await tx.inventario.update({
            where: { id: existing.id },
            data: {
              cantidad: toDecimal(nuevaCantidad),
              fechaAct: new Date()
            }
          })
        : await tx.inventario.create({
            data: {
              productoId: data.productoId,
              ubicacionId: data.ubicacionId,
              cantidad: toDecimal(data.cantidad)
            }
          });

      await tx.ubicacion.update({
        where: { id: data.ubicacionId },
        data: { ocupada: nuevaCantidad > 0 }
      });

      const movimiento = await tx.movimientoInventario.create({
        data: {
          tipo: TipoMovimiento.ENTRADA,
          productoId: data.productoId,
          cantidad: toDecimal(data.cantidad),
          usuarioId: req.user!.id,
          referencia: data.referencia
        }
      });

      return { inventario, movimiento };
    });

    res.status(201).json(result);
  })
);

inventarioRouter.post(
  "/salida",
  requirePermission("Inventario", "Ajustes operativos"),
  asyncHandler(async (req, res) => {
    const data = movimientoSalidaSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventario.findFirst({
        where: {
          productoId: data.productoId,
          ubicacionId: data.ubicacionId
        }
      });

      if (!existing || Number(existing.cantidad) < data.cantidad) {
        throw new AppError("Stock insuficiente en la ubicacion seleccionada", 400);
      }

      const nuevaCantidad = Number(existing.cantidad) - data.cantidad;

      const inventario = await tx.inventario.update({
        where: { id: existing.id },
        data: {
          cantidad: toDecimal(nuevaCantidad),
          fechaAct: new Date()
        }
      });

      await tx.ubicacion.update({
        where: { id: data.ubicacionId },
        data: { ocupada: nuevaCantidad > 0 }
      });

      const movimiento = await tx.movimientoInventario.create({
        data: {
          tipo: TipoMovimiento.SALIDA,
          productoId: data.productoId,
          cantidad: toDecimal(data.cantidad),
          usuarioId: req.user!.id,
          referencia: data.referencia
        }
      });

      return { inventario, movimiento };
    });

    res.status(201).json(result);
  })
);

inventarioRouter.post(
  "/ajuste",
  requirePermission("Ajustes operativos", "Inventario"),
  asyncHandler(async (req, res) => {
    const data = ajusteSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventario.findFirst({
        where: {
          productoId: data.productoId,
          ubicacionId: data.ubicacionId
        }
      });

      const inventario = existing
        ? await tx.inventario.update({
            where: { id: existing.id },
            data: {
              cantidad: toDecimal(data.nuevaCantidad),
              fechaAct: new Date()
            }
          })
        : await tx.inventario.create({
            data: {
              productoId: data.productoId,
              ubicacionId: data.ubicacionId,
              cantidad: toDecimal(data.nuevaCantidad)
            }
          });

      await tx.ubicacion.update({
        where: { id: data.ubicacionId },
        data: { ocupada: data.nuevaCantidad > 0 }
      });

      const movimiento = await tx.movimientoInventario.create({
        data: {
          tipo: TipoMovimiento.AJUSTE,
          productoId: data.productoId,
          cantidad: toDecimal(data.nuevaCantidad),
          usuarioId: req.user!.id,
          referencia: data.motivo
        }
      });

      return { inventario, movimiento };
    });

    res.status(201).json(result);
  })
);
