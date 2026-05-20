import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";
export const ubicacionesRouter = Router();
const bodegaSchema = z.object({
    nombre: z.string().min(2),
    direccion: z.string().optional()
});
const seccionSchema = z.object({
    nombre: z.string().min(1),
    bodegaId: z.string().uuid()
});
const rackSchema = z.object({
    codigo: z.string().min(2),
    seccionId: z.string().uuid(),
    capacidad: z.number().int().min(1)
});
const ubicacionSchema = z.object({
    codigo: z.string().min(2),
    rackId: z.string().uuid(),
    nivel: z.number().int().min(1),
    capacidadMax: z.number().positive()
});
ubicacionesRouter.use(requireAuth);
ubicacionesRouter.get("/", asyncHandler(async (_req, res) => {
    const bodegas = await prisma.bodega.findMany({
        include: {
            secciones: {
                include: {
                    racks: {
                        include: {
                            ubicaciones: {
                                orderBy: { codigo: "asc" }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { nombre: "asc" }
    });
    res.json(bodegas);
}));
ubicacionesRouter.post("/bodegas", requirePermission("Ubicaciones"), asyncHandler(async (req, res) => {
    const data = bodegaSchema.parse(req.body);
    const bodega = await prisma.bodega.create({ data });
    res.status(201).json(bodega);
}));
ubicacionesRouter.post("/secciones", requirePermission("Ubicaciones"), asyncHandler(async (req, res) => {
    const data = seccionSchema.parse(req.body);
    const seccion = await prisma.seccion.create({ data });
    res.status(201).json(seccion);
}));
ubicacionesRouter.post("/racks", requirePermission("Ubicaciones"), asyncHandler(async (req, res) => {
    const data = rackSchema.parse(req.body);
    const rack = await prisma.rack.create({ data });
    res.status(201).json(rack);
}));
ubicacionesRouter.post("/items", requirePermission("Ubicaciones"), asyncHandler(async (req, res) => {
    const data = ubicacionSchema.parse(req.body);
    const ubicacion = await prisma.ubicacion.create({ data });
    res.status(201).json(ubicacion);
}));
