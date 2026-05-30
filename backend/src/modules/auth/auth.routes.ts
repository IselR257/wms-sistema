import { Router } from "express";
import { RolUsuario } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";

import { clearAuthCookie, createAuthCookie } from "../../lib/auth-cookie.js";
import { AppError, asyncHandler } from "../../lib/http.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { buildSessionPayload } from "../../lib/session.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const bootstrapSchema = z.object({
  nombre: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6)
});

authRouter.post(
  "/bootstrap",
  asyncHandler(async (req, res) => {
    const data = bootstrapSchema.parse(req.body);
    const userCount = await prisma.usuario.count();

    if (userCount > 0) {
      throw new AppError("El usuario administrador inicial ya fue creado", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        passwordHash,
        rol: RolUsuario.ADMIN
      }
    });

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      rol: user.rol
    });

    res.setHeader("Set-Cookie", createAuthCookie(token));
    res.status(201).json(
      await buildSessionPayload({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
        createdAt: user.createdAt
      })
    );
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await prisma.usuario.findUnique({
      where: { email: data.email }
    });

    if (!user || !user.activo) {
      throw new AppError("Credenciales invalidas", 401);
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      throw new AppError("Credenciales invalidas", 401);
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      rol: user.rol
    });

    res.setHeader("Set-Cookie", createAuthCookie(token));
    res.json(
      await buildSessionPayload({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
        createdAt: user.createdAt
      })
    );
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.setHeader("Set-Cookie", clearAuthCookie());
    res.json({ message: "Sesion cerrada" });
  })
);
