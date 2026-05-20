import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/http.js";
export const errorHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
        return res.status(400).json({
            message: "Datos invalidos",
            issues: error.issues
        });
    }
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            message: error.message
        });
    }
    if (error instanceof Error && error.name === "TokenExpiredError") {
        return res.status(401).json({
            message: "La sesion expiró. Inicia sesión de nuevo."
        });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            const targets = Array.isArray(error.meta?.target) ? error.meta.target : [];
            if (targets.includes("numero")) {
                return res.status(400).json({
                    message: "El número de orden ya existe. Usa otro correlativo, por ejemplo uno nuevo como OD-0003."
                });
            }
            const fields = targets.length ? targets.join(", ") : "campo único";
            return res.status(400).json({
                message: `Ya existe un registro con el mismo valor en: ${fields}`
            });
        }
    }
    console.error(error);
    return res.status(500).json({
        message: "Error interno del servidor"
    });
};
