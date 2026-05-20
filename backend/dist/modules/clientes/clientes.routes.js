import { Router } from "express";
import { RolUsuario } from "@prisma/client";
import { z } from "zod";
import { createAuditLog } from "../../lib/audit.js";
import { AppError, asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission, requireRole } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";
export const clientesRouter = Router();
const clienteSchema = z.object({
    nombre: z.string().min(2),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    telefono: z.string().optional(),
    direccion: z.string().optional()
});
clientesRouter.use(requireAuth);
clientesRouter.get("/", requirePermission("Despachos", "Configuraciones globales"), asyncHandler(async (_req, res) => {
    const clientes = await prisma.cliente.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" }
    });
    res.json(clientes);
}));
clientesRouter.post("/", requireRole(RolUsuario.ADMIN, RolUsuario.SUPERVISOR), asyncHandler(async (req, res) => {
    const data = clienteSchema.parse(req.body);
    const cliente = await prisma.cliente.create({
        data: {
            nombre: data.nombre,
            email: data.email || null,
            telefono: data.telefono || null,
            direccion: data.direccion || null
        }
    });
    await createAuditLog({
        req,
        accion: "CLIENTE_CREADO",
        metadata: { clienteId: cliente.id, nombre: cliente.nombre }
    });
    res.status(201).json(cliente);
}));
clientesRouter.patch("/:id", requireRole(RolUsuario.ADMIN, RolUsuario.SUPERVISOR), asyncHandler(async (req, res) => {
    const data = clienteSchema.parse(req.body);
    const cliente = await prisma.cliente.update({
        where: { id: String(req.params.id) },
        data: {
            nombre: data.nombre,
            email: data.email || null,
            telefono: data.telefono || null,
            direccion: data.direccion || null
        }
    });
    await createAuditLog({
        req,
        accion: "CLIENTE_ACTUALIZADO",
        metadata: { clienteId: cliente.id, nombre: cliente.nombre }
    });
    res.json(cliente);
}));
clientesRouter.delete("/:id", requireRole(RolUsuario.ADMIN, RolUsuario.SUPERVISOR), asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const ordenesRelacionadas = await prisma.ordenDespacho.count({
        where: { clienteId: id }
    });
    if (ordenesRelacionadas) {
        throw new AppError("No se puede eliminar el cliente porque ya tiene despachos relacionados", 400);
    }
    const cliente = await prisma.cliente.delete({
        where: { id }
    });
    await createAuditLog({
        req,
        accion: "CLIENTE_ELIMINADO",
        metadata: { clienteId: cliente.id, nombre: cliente.nombre }
    });
    res.json({ message: "Cliente eliminado" });
}));
