import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt.ts";
import { AppError } from "../middleware/errorHandler.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Token d'authentification manquant");
  }

  try {
    const token = header.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new AppError(401, "Token invalide ou expiré");
  }
}

export function requirePremium(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.planType !== "premium") {
    throw new AppError(403, "Cette fonctionnalité nécessite un abonnement Premium");
  }
  next();
}
