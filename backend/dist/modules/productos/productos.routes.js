import { Router } from "express";
import { z } from "zod";
import { AppError, asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";
export const productosRouter = Router();
const categoriaSchema = z.object({
    nombre: z.string().min(2),
    descripcion: z.string().optional()
});
const productoSchema = z.object({
    codigoBarras: z.string().min(3),
    nombre: z.string().min(3),
    descripcion: z.string().optional(),
    categoriaId: z.string().uuid().optional(),
    unidadMedida: z.string().min(1),
    stockMinimo: z.number().int().min(0).default(0),
    stockMaximo: z.number().int().min(0).default(0)
});
productosRouter.use(requireAuth);
productosRouter.get("/categorias", asyncHandler(async (_req, res) => {
    const categorias = await prisma.categoria.findMany({
        orderBy: { nombre: "asc" }
    });
    res.json(categorias);
}));
productosRouter.post("/categorias", requirePermission("Configuraciones globales"), asyncHandler(async (req, res) => {
    const data = categoriaSchema.parse(req.body);
    const categoria = await prisma.categoria.create({ data });
    res.status(201).json(categoria);
}));
productosRouter.get("/", asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    const productos = await prisma.producto.findMany({
        where: q
            ? {
                OR: [
                    { nombre: { contains: q, mode: "insensitive" } },
                    { codigoBarras: { contains: q, mode: "insensitive" } }
                ]
            }
            : undefined,
        include: {
            categoria: true
        },
        orderBy: { nombre: "asc" }
    });
    res.json(productos);
}));
productosRouter.post("/", requirePermission("Configuraciones globales"), asyncHandler(async (req, res) => {
    const data = productoSchema.parse(req.body);
    const producto = await prisma.producto.create({ data });
    res.status(201).json(producto);
}));
productosRouter.patch("/:id", requirePermission("Configuraciones globales"), asyncHandler(async (req, res) => {
    const data = productoSchema.parse(req.body);
    const producto = await prisma.producto.update({
        where: { id: String(req.params.id) },
        data,
        include: {
            categoria: true
        }
    });
    res.json(producto);
}));
productosRouter.delete("/:id", requirePermission("Configuraciones globales"), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const [inventario, movimientos, compras, recepciones, despachos] = await Promise.all([
        prisma.inventario.count({ where: { productoId: id } }),
        prisma.movimientoInventario.count({ where: { productoId: id } }),
        prisma.detalleOrdenCompra.count({ where: { productoId: id } }),
        prisma.detalleRecepcion.count({ where: { productoId: id } }),
        prisma.detalleDespacho.count({ where: { productoId: id } })
    ]);
    if (inventario || movimientos || compras || recepciones || despachos) {
        throw new AppError("No se puede eliminar el producto porque ya tiene inventario o movimientos relacionados", 400);
    }
    await prisma.producto.delete({
        where: { id }
    });
    res.json({ message: "Producto eliminado" });
}));
