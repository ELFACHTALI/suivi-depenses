import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

export const REFRESH_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 jours
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY ?? "15m";

export interface AccessTokenPayload {
  sub: string;       // user id
  email: string;
  planType: string;
  jti: string;
}

function getKeys(): { sign: string | Buffer; verify: string | Buffer; alg: jwt.Algorithm } {
  const priv = process.env.JWT_PRIVATE_KEY;
  const pub = process.env.JWT_PUBLIC_KEY;

  if (priv && pub) {
    return {
      sign: Buffer.from(priv, "base64").toString(),
      verify: Buffer.from(pub, "base64").toString(),
      alg: "RS256",
    };
  }

  // Fallback HS256 pour le développement sans clés RSA générées
  const secret = process.env.COOKIE_SECRET ?? "dev-secret-change-in-production-32";
  return { sign: secret, verify: secret, alg: "HS256" };
}

export function createAccessToken(payload: Omit<AccessTokenPayload, "jti">): string {
  const { sign, alg } = getKeys();
  return jwt.sign({ ...payload, jti: randomUUID() }, sign, {
    algorithm: alg,
    expiresIn: ACCESS_EXPIRY,
  } as jwt.SignOptions);
}

export function createRefreshToken(): { token: string; jti: string } {
  const jti = randomUUID();
  const { sign, alg } = getKeys();
  const token = jwt.sign({ jti }, sign, {
    algorithm: alg,
    expiresIn: `${REFRESH_EXPIRY_SECONDS}s`,
  } as jwt.SignOptions);
  return { token, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const { verify, alg } = getKeys();
  return jwt.verify(token, verify, { algorithms: [alg] }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { jti: string } {
  const { verify, alg } = getKeys();
  return jwt.verify(token, verify, { algorithms: [alg] }) as { jti: string };
}
