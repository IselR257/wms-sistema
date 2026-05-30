import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { requireAuth } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [productos, inventario, movimientos, ubicaciones] = await Promise.all([
      prisma.producto.count(),
      prisma.inventario.findMany({
        include: {
          producto: true,
          ubicacion: true
        }
      }),
      prisma.movimientoInventario.findMany({
        include: {
          producto: true,
          usuario: {
            select: { nombre: true, rol: true }
          }
        },
        orderBy: { fecha: "desc" },
        take: 8
      }),
      prisma.ubicacion.findMany()
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const movimientosHoy = movimientos.filter((mov) => mov.fecha >= today).length;
    const alertas = inventario.filter((item) => Number(item.cantidad) <= item.producto.stockMinimo);
    const ocupadas = ubicaciones.filter((item) => item.ocupada).length;
    const ocupacion = ubicaciones.length ? Math.round((ocupadas / ubicaciones.length) * 100) : 0;

    const recentMovements = movimientos.map((mov) => ({
      id: mov.id,
      tipo: mov.tipo,
      producto: mov.producto.nombre,
      cantidad: Number(mov.cantidad),
      usuario: mov.usuario.nombre,
      rol: mov.usuario.rol,
      fecha: mov.fecha
    }));

    res.json({
      kpis: {
        totalProductos: productos,
        movimientosHoy,
        alertasStock: alertas.length,
        ocupacionBodega: ocupacion
      },
      alertas: alertas.slice(0, 10).map((item) => ({
        id: item.id,
        producto: item.producto.nombre,
        ubicacion: item.ubicacion.codigo,
        stockActual: Number(item.cantidad),
        stockMinimo: item.producto.stockMinimo
      })),
      recentMovements
    });
  })
);
