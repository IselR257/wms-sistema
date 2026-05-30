import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "8h";

export type AuthPayload = {
  sub: string;
  email: string;
  rol: string;
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET no esta configurado");
  }

  return secret;
};

export const signAccessToken = (payload: AuthPayload) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, getJwtSecret()) as AuthPayload;
