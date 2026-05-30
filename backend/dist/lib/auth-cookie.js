export const AUTH_COOKIE_NAME = "wms_auth";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8;
const baseCookie = `${AUTH_COOKIE_NAME}=`;
const commonAttrs = "Path=/; HttpOnly; SameSite=Lax";
export const createAuthCookie = (token) => `${baseCookie}${encodeURIComponent(token)}; Max-Age=${AUTH_COOKIE_MAX_AGE}; ${commonAttrs}`;
export const clearAuthCookie = () => `${baseCookie}; Max-Age=0; ${commonAttrs}`;
export const readAuthCookie = (cookieHeader) => {
    if (!cookieHeader)
        return "";
    const pair = cookieHeader
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (!pair)
        return "";
    return decodeURIComponent(pair.slice(AUTH_COOKIE_NAME.length + 1));
};
