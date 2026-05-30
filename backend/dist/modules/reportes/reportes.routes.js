import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { requireAuth } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";
export const reportesRouter = Router();
reportesRouter.use(requireAuth);
const toStartOfDay = (value) => {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};
const toEndOfDay = (value) => {
    const date = value ? new Date(value) : new Date();
    date.setHours(23, 59, 59, 999);
    return date;
};
reportesRouter.get("/", asyncHandler(async (req, res) => {
    const from = toStartOfDay(typeof req.query.from === "string" ? req.query.from : undefined);
    const to = toEndOfDay(typeof req.query.to === "string" ? req.query.to : undefined);
    if (from > to) {
        res.status(400).json({ message: "El rango de fechas es invalido" });
        return;
    }
    const [movimientos, inventario, compras, despachos, auditoria] = await Promise.all([
        prisma.movimientoInventario.findMany({
            where: {
                fecha: {
                    gte: from,
                    lte: to
                }
            },
            include: {
                producto: true,
                usuario: {
                    select: { id: true, nombre: true, email: true, rol: true }
                }
            },
            orderBy: { fecha: "asc" }
        }),
        prisma.inventario.findMany({
            include: {
                producto: {
                    include: { categoria: true }
                },
                ubicacion: true
            }
        }),
        prisma.ordenCompra.findMany({
            where: {
                fechaEmision: {
                    gte: from,
                    lte: to
                }
            },
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
        }),
        prisma.ordenDespacho.findMany({
            where: {
                OR: [
                    {
                        fechaRequerida: {
                            gte: from,
                            lte: to
                        }
                    },
                    {
                        createdAt: {
                            gte: from,
                            lte: to
                        }
                    }
                ]
            },
            include: {
                detalles: {
                    include: {
                        producto: true,
                        ubicacion: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        }),
        prisma.auditoria.findMany({
            where: {
                fecha: {
                    gte: from,
                    lte: to
                }
            },
            include: {
                usuario: {
                    select: { id: true, nombre: true, email: true, rol: true }
                }
            },
            orderBy: { fecha: "desc" },
            take: 20
        })
    ]);
    const movementByDayMap = new Map();
    const rotationMap = new Map();
    for (const movimiento of movimientos) {
        const fecha = movimiento.fecha.toISOString().slice(0, 10);
        const day = movementByDayMap.get(fecha) ?? { fecha, entradas: 0, salidas: 0, ajustes: 0 };
        const cantidad = Number(movimiento.cantidad);
        if (movimiento.tipo === "ENTRADA")
            day.entradas += cantidad;
        if (movimiento.tipo === "SALIDA")
            day.salidas += cantidad;
        if (movimiento.tipo === "AJUSTE")
            day.ajustes += cantidad;
        movementByDayMap.set(fecha, day);
        const rank = rotationMap.get(movimiento.productoId) ?? {
            productoId: movimiento.productoId,
            producto: movimiento.producto.nombre,
            categoria: movimiento.producto.categoriaId ?? "SIN_CATEGORIA",
            entradas: 0,
            salidas: 0,
            ajustes: 0,
            total: 0
        };
        if (movimiento.tipo === "ENTRADA")
            rank.entradas += cantidad;
        if (movimiento.tipo === "SALIDA")
            rank.salidas += cantidad;
        if (movimiento.tipo === "AJUSTE")
            rank.ajustes += cantidad;
        rank.total += cantidad;
        rotationMap.set(movimiento.productoId, rank);
    }
    const lowStock = inventario
        .filter((item) => Number(item.cantidad) <= item.producto.stockMinimo)
        .map((item) => ({
        id: item.id,
        producto: item.producto.nombre,
        codigoBarras: item.producto.codigoBarras,
        categoria: item.producto.categoria?.nombre ?? "Sin categoria",
        ubicacion: item.ubicacion.codigo,
        stockActual: Number(item.cantidad),
        stockMinimo: item.producto.stockMinimo
    }));
    const dispatchUnits = despachos.reduce((sum, order) => sum + order.detalles.reduce((detailSum, detail) => detailSum + Number(detail.cantidad), 0), 0);
    const purchaseUnits = compras.reduce((sum, order) => sum + order.detalles.reduce((detailSum, detail) => detailSum + Number(detail.cantidad), 0), 0);
    res.json({
        range: {
            from,
            to
        },
        summary: {
            movimientos: movimientos.length,
            entradas: movimientos.filter((item) => item.tipo === "ENTRADA").length,
            salidas: movimientos.filter((item) => item.tipo === "SALIDA").length,
            ajustes: movimientos.filter((item) => item.tipo === "AJUSTE").length,
            unidadesEntrantes: movimientos
                .filter((item) => item.tipo === "ENTRADA")
                .reduce((sum, item) => sum + Number(item.cantidad), 0),
            unidadesSalientes: movimientos
                .filter((item) => item.tipo === "SALIDA")
                .reduce((sum, item) => sum + Number(item.cantidad), 0),
            ordenesCompra: compras.length,
            ordenesDespacho: despachos.length,
            unidadesCompradas: purchaseUnits,
            unidadesDespachadas: dispatchUnits,
            alertasStock: lowStock.length,
            eventosAuditados: auditoria.length
        },
        movementByDay: [...movementByDayMap.values()],
        rotationRanking: [...rotationMap.values()].sort((a, b) => b.total - a.total).slice(0, 10),
        lowStock,
        purchaseSummary: compras.map((order) => ({
            id: order.id,
            numero: order.numero,
            proveedor: order.proveedor.nombre,
            estado: order.estado,
            fecha: order.fechaEmision,
            items: order.detalles.length,
            unidades: order.detalles.reduce((sum, detail) => sum + Number(detail.cantidad), 0),
            recepciones: order.recepciones.length
        })),
        dispatchSummary: despachos.map((order) => ({
            id: order.id,
            numero: order.numero,
            cliente: order.cliente,
            estado: order.estado,
            fecha: order.fechaRequerida,
            items: order.detalles.length,
            unidades: order.detalles.reduce((sum, detail) => sum + Number(detail.cantidad), 0)
        })),
        recentAudit: auditoria
    });
}));
