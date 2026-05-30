import { getRoleConfiguration } from "./permissions.js";
export const buildSessionPayload = async (user) => {
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
