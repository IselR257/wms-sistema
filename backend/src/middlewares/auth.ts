import type { NextFunction, Request, Response } from "express";
import { RolUsuario } from "@prisma/client";

import { readAuthCookie } from "../lib/auth-cookie.js";
import { AppError } from "../lib/http.js";
import { getRoleConfiguration, type Permission } from "../lib/permissions.js";
import { verifyAccessToken } from "../lib/jwt.js";

type AuthenticatedUser = {
  id: string;
  email: string;
  rol: RolUsuario;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const cookieToken = readAuthCookie(req.headers.cookie);
  const bearerToken = header?.startsWith("Bearer ") ? header.replace("Bearer ", "") : "";
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new AppError("Token no proporcionado", 401));
  }
  const payload = verifyAccessToken(token);

  req.user = {
    id: payload.sub,
    email: payload.email,
    rol: payload.rol as RolUsuario
  };

  return next();
  };

export const requireRole =
  (...roles: RolUsuario[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("No autenticado", 401));
    }

    if (!roles.includes(req.user.rol)) {
      return next(new AppError("No tiene permisos para esta accion", 403));
    }

    return next();
  };

export const requirePermission =
  (...permissions: Permission[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    (async () => {
      if (!req.user) {
        return next(new AppError("No autenticado", 401));
      }

      const roleConfig = await getRoleConfiguration(req.user.rol);
      const allowed = permissions.some((permission) => roleConfig.permisosList.includes(permission));

      if (!allowed) {
        return next(new AppError("No tiene permisos para esta accion", 403));
      }

      return next();
    })().catch(next);
  };
