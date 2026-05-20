import { Router } from "express";
import { RolUsuario } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
import { AppError, asyncHandler } from "../../lib/http.js";
import { buildSessionPayload } from "../../lib/session.js";
import { requireAuth, requirePermission, requireRole } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";
export const usuariosRouter = Router();
const createUserSchema = z.object({
    nombre: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    rol: z.nativeEnum(RolUsuario)
});
const updateUserSchema = z.object({
    nombre: z.string().min(3),
    email: z.string().email(),
    rol: z.nativeEnum(RolUsuario),
    password: z.string().min(6).optional()
});
const updateProfileSchema = z.object({
    nombre: z.string().min(3),
    email: z.string().email()
});
const updatePasswordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
});
usuariosRouter.use(requireAuth);
usuariosRouter.get("/me", asyncHandler(async (req, res) => {
    const user = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true }
    });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    res.json(await buildSessionPayload(user));
}));
usuariosRouter.patch("/me", asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.usuario.update({
        where: { id: req.user.id },
        data,
        select: { id: true, nombre: true, email: true, rol: true, activo: true }
    });
    res.json(user);
}));
usuariosRouter.patch("/me/password", asyncHandler(async (req, res) => {
    const data = updatePasswordSchema.parse(req.body);
    const user = await prisma.usuario.findUnique({
        where: { id: req.user.id }
    });
    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }
    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) {
        throw new AppError("La contrasena actual es incorrecta", 400);
    }
    await prisma.usuario.update({
        where: { id: user.id },
        data: {
            passwordHash: await bcrypt.hash(data.newPassword, 12)
        }
    });
    res.json({ message: "Contrasena actualizada" });
}));
usuariosRouter.get("/", requirePermission("Usuarios"), asyncHandler(async (_req, res) => {
    const users = await prisma.usuario.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true }
    });
    res.json(users);
}));
usuariosRouter.post("/", requireRole(RolUsuario.ADMIN), asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.usuario.create({
        data: {
            nombre: data.nombre,
            email: data.email,
            passwordHash,
            rol: data.rol
        },
        select: { id: true, nombre: true, email: true, rol: true, activo: true }
    });
    res.status(201).json(user);
}));
usuariosRouter.patch("/:id", requireRole(RolUsuario.ADMIN), asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.usuario.update({
        where: { id: String(req.params.id) },
        data: {
            nombre: data.nombre,
            email: data.email,
            rol: data.rol,
            passwordHash: data.password ? await bcrypt.hash(data.password, 12) : undefined
        },
        select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true }
    });
    res.json(user);
}));
usuariosRouter.patch("/:id/status", requireRole(RolUsuario.ADMIN), asyncHandler(async (req, res) => {
    const body = z.object({ activo: z.boolean() }).parse(req.body);
    const user = await prisma.usuario.update({
        where: { id: String(req.params.id) },
        data: { activo: body.activo },
        select: { id: true, nombre: true, email: true, rol: true, activo: true }
    });
    res.json(user);
}));
