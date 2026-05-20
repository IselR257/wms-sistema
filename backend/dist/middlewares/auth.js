import { readAuthCookie } from "../lib/auth-cookie.js";
import { AppError } from "../lib/http.js";
import { getRoleConfiguration } from "../lib/permissions.js";
import { verifyAccessToken } from "../lib/jwt.js";
export const requireAuth = (req, _res, next) => {
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
        rol: payload.rol
    };
    return next();
};
export const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(new AppError("No autenticado", 401));
    }
    if (!roles.includes(req.user.rol)) {
        return next(new AppError("No tiene permisos para esta accion", 403));
    }
    return next();
};
export const requirePermission = (...permissions) => (req, _res, next) => {
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
