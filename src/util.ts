import jwt, { JwtPayload } from "jsonwebtoken";

export function getIDfromJWT(token: string, JWT_SECRET: string): string | JwtPayload | null {
    try {
        // verify the JWT is real
        const verify = jwt.verify(token, JWT_SECRET);
        return verify;
    } catch {
        return null;
    }
}