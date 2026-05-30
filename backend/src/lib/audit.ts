import type { Request } from "express";
import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma.js";

type AuditInput = {
  req?: Request;
  usuarioId?: string;
  accion: string;
  metadata?: Prisma.InputJsonValue;
};

export const createAuditLog = async ({ req, usuarioId, accion, metadata }: AuditInput) => {
  const actorId = usuarioId ?? req?.user?.id;

  if (!actorId) {
    return;
  }

  await prisma.auditoria.create({
    data: {
      usuarioId: actorId,
      accion,
      ipOrigen: req?.ip,
      metadata
    }
  });
};
