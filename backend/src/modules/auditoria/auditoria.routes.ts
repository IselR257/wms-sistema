import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";

export const auditoriaRouter = Router();

auditoriaRouter.use(requireAuth, requirePermission("Auditoría"));

auditoriaRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditoria.findMany({
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true, rol: true }
        }
      },
      orderBy: { fecha: "desc" },
      take: 100
    });

    res.json(logs);
  })
);
