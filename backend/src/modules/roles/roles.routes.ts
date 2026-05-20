import { RolUsuario } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

import { createAuditLog } from "../../lib/audit.js";
import { asyncHandler } from "../../lib/http.js";
import {
  DEFAULT_ROLE_DEFINITIONS,
  PERMISSION_OPTIONS,
  ensureRoleConfigurations,
  listRoleConfigurations,
  normalizePermissions
} from "../../lib/permissions.js";
import { requireAuth, requirePermission, requireRole } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";

export const rolesRouter = Router();

const roleConfigSchema = z.object({
  descripcion: z.string().min(5),
  permisosList: z.array(z.enum(PERMISSION_OPTIONS)).min(1)
});

rolesRouter.use(requireAuth);

rolesRouter.get(
  "/configuraciones",
  requirePermission("Roles"),
  asyncHandler(async (_req, res) => {
    res.json(await listRoleConfigurations());
  })
);

rolesRouter.patch(
  "/configuraciones/:rol",
  requireRole(RolUsuario.ADMIN),
  asyncHandler(async (req, res) => {
    const rol = z.nativeEnum(RolUsuario).parse(req.params.rol);
    const data = roleConfigSchema.parse(req.body);
    await ensureRoleConfigurations();

    const updated = await prisma.configuracionRol.update({
      where: { rol },
      data: {
        descripcion: data.descripcion,
        permisos: normalizePermissions(data.permisosList)
      }
    });

    await createAuditLog({
      req,
      accion: "CONFIGURACION_ROL_ACTUALIZADA",
      metadata: {
        rol,
        permisos: updated.permisos,
        descripcion: updated.descripcion,
        defaults: DEFAULT_ROLE_DEFINITIONS[rol]
      }
    });

    res.json({
      rol: updated.rol,
      descripcion: updated.descripcion,
      permisosList: normalizePermissions(updated.permisos)
    });
  })
);
