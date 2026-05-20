import { prisma } from "./prisma.js";
export const createAuditLog = async ({ req, usuarioId, accion, metadata }) => {
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
