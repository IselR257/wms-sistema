import type { Express } from "express";

import { auditoriaRouter } from "../modules/auditoria/auditoria.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { clientesRouter } from "../modules/clientes/clientes.routes.js";
import { comprasRouter } from "../modules/compras/compras.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { despachosRouter } from "../modules/despachos/despachos.routes.js";
import { inventarioRouter } from "../modules/inventario/inventario.routes.js";
import { productosRouter } from "../modules/productos/productos.routes.js";
import { proveedoresRouter } from "../modules/proveedores/proveedores.routes.js";
import { reportesRouter } from "../modules/reportes/reportes.routes.js";
import { rolesRouter } from "../modules/roles/roles.routes.js";
import { usuariosRouter } from "../modules/usuarios/usuarios.routes.js";
import { ubicacionesRouter } from "../modules/ubicaciones/ubicaciones.routes.js";

export const registerRoutes = (app: Express) => {
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/usuarios", usuariosRouter);
  app.use("/api/roles", rolesRouter);
  app.use("/api/clientes", clientesRouter);
  app.use("/api/productos", productosRouter);
  app.use("/api/proveedores", proveedoresRouter);
  app.use("/api/compras", comprasRouter);
  app.use("/api/despachos", despachosRouter);
  app.use("/api/ubicaciones", ubicacionesRouter);
  app.use("/api/inventario", inventarioRouter);
  app.use("/api/auditoria", auditoriaRouter);
  app.use("/api/reportes", reportesRouter);
};
