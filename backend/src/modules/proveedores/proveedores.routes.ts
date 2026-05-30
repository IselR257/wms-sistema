import { Router } from "express";
import { z } from "zod";

import { createAuditLog } from "../../lib/audit.js";
import { AppError, asyncHandler } from "../../lib/http.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.js";
import { prisma } from "../../lib/prisma.js";

export const proveedoresRouter = Router();

const proveedorSchema = z.object({
  nombre: z.string().min(2),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional()
});

proveedoresRouter.use(requireAuth);

proveedoresRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: "asc" }
    });

    res.json(proveedores);
  })
);

proveedoresRouter.post(
  "/",
  requirePermission("Compras"),
  asyncHandler(async (req, res) => {
    const data = proveedorSchema.parse(req.body);
    const proveedor = await prisma.proveedor.create({ data });
    await createAuditLog({
      req,
      accion: "PROVEEDOR_CREADO",
      metadata: { proveedorId: proveedor.id, nombre: proveedor.nombre }
    });

    res.status(201).json(proveedor);
  })
);

proveedoresRouter.patch(
  "/:id",
  requirePermission("Compras"),
  asyncHandler(async (req, res) => {
    const data = proveedorSchema.parse(req.body);
    const proveedor = await prisma.proveedor.update({
      where: { id: String(req.params.id) },
      data
    });

    await createAuditLog({
      req,
      accion: "PROVEEDOR_ACTUALIZADO",
      metadata: { proveedorId: proveedor.id, nombre: proveedor.nombre }
    });

    res.json(proveedor);
  })
);

proveedoresRouter.delete(
  "/:id",
  requirePermission("Compras"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const comprasRelacionadas = await prisma.ordenCompra.count({
      where: { proveedorId: id }
    });

    if (comprasRelacionadas) {
      throw new AppError(
        "No se puede eliminar el proveedor porque ya tiene órdenes de compra relacionadas",
        400
      );
    }

    const proveedor = await prisma.proveedor.delete({
      where: { id }
    });

    await createAuditLog({
      req,
      accion: "PROVEEDOR_ELIMINADO",
      metadata: { proveedorId: proveedor.id, nombre: proveedor.nombre }
    });

    res.json({ message: "Proveedor eliminado" });
  })
);
