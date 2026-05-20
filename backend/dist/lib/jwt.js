import jwt from "jsonwebtoken";
const JWT_EXPIRES_IN = "8h";
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET no esta configurado");
    }
    return secret;
};
export const signAccessToken = (payload) => jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
export const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret());
