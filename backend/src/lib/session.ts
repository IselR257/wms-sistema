import type { Usuario } from "@prisma/client";

import { getRoleConfiguration } from "./permissions.js";

type SessionUserInput = Pick<Usuario, "id" | "nombre" | "email" | "rol" | "activo" | "createdAt">;

export const buildSessionPayload = async (user: SessionUserInput) => {
  const roleConfig = await getRoleConfiguration(user.rol);

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      createdAt: user.createdAt
    },
    roleDescription: roleConfig.descripcion,
    permissions: roleConfig.permisosList
  };
};
