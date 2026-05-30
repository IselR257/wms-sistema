import { RolUsuario } from "@prisma/client";

import { prisma } from "./prisma.js";

export const PERMISSION_OPTIONS = [
  "Usuarios",
  "Roles",
  "Compras",
  "Recepciones",
  "Despachos",
  "Picking",
  "Inventario",
  "Ubicaciones",
  "Reportes",
  "Auditoría",
  "Ajustes operativos",
  "Configuraciones globales"
] as const;

export type Permission = (typeof PERMISSION_OPTIONS)[number];

const VALID_PERMISSIONS = new Set<string>(PERMISSION_OPTIONS);
let ensureRoleConfigurationsPromise: Promise<void> | null = null;

export const DEFAULT_ROLE_DEFINITIONS: Record<RolUsuario, { descripcion: string; permisosList: Permission[] }> = {
  ADMIN: {
    descripcion: "Administra usuarios, catálogos, compras, despachos y configuraciones globales.",
    permisosList: ["Usuarios", "Roles", "Compras", "Despachos", "Picking", "Inventario", "Ubicaciones", "Auditoría", "Configuraciones globales"]
  },
  SUPERVISOR: {
    descripcion: "Supervisa la operación y gestiona órdenes, recepción, picking y seguimiento.",
    permisosList: ["Compras", "Recepciones", "Despachos", "Picking", "Reportes", "Inventario", "Auditoría"]
  },
  BODEGUERO: {
    descripcion: "Ejecuta tareas operativas de bodega como recepcionar, preparar y mover inventario.",
    permisosList: ["Recepciones", "Picking", "Despachos", "Ajustes operativos"]
  }
};

export const normalizePermissions = (permissions: string[]) =>
  [...new Set(permissions.filter((permission) => VALID_PERMISSIONS.has(permission)))] as Permission[];

const syncRoleConfigurations = async () => {
  for (const [rol, config] of Object.entries(DEFAULT_ROLE_DEFINITIONS)) {
    await prisma.configuracionRol.upsert({
      where: { rol: rol as RolUsuario },
      update: {},
      create: {
        rol: rol as RolUsuario,
        descripcion: config.descripcion,
        permisos: config.permisosList
      }
    });
  }
};

export const ensureRoleConfigurations = async () => {
  if (!ensureRoleConfigurationsPromise) {
    ensureRoleConfigurationsPromise = syncRoleConfigurations().finally(() => {
      ensureRoleConfigurationsPromise = null;
    });
  }

  await ensureRoleConfigurationsPromise;
};

export const listRoleConfigurations = async () => {
  await ensureRoleConfigurations();
  const rows = await prisma.configuracionRol.findMany({
    orderBy: { rol: "asc" }
  });

  return rows.map((row) => ({
    rol: row.rol,
    descripcion: row.descripcion,
    permisosList: normalizePermissions(row.permisos)
  }));
};

export const getRoleConfiguration = async (rol: RolUsuario) => {
  await ensureRoleConfigurations();
  const row = await prisma.configuracionRol.findUnique({
    where: { rol }
  });

  if (!row) {
    const fallback = DEFAULT_ROLE_DEFINITIONS[rol];
    return {
      rol,
      descripcion: fallback.descripcion,
      permisosList: fallback.permisosList
    };
  }

  return {
    rol: row.rol,
    descripcion: row.descripcion,
    permisosList: normalizePermissions(row.permisos)
  };
};
