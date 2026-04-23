import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.ts";
import { users } from "../db/schema/index.ts";
import { eq, and, isNull } from "drizzle-orm";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  REFRESH_EXPIRY_SECONDS,
} from "./jwt.ts";
import {
  generateTotpSecret,
  generateQrCode,
  verifyTotpToken,
} from "./2fa.ts";
import { redis } from "../lib/redis.ts";
import { validate } from "../middleware/validate.ts";
import { loginLimiter } from "../middleware/rateLimiter.ts";
import { AppError } from "../middleware/errorHandler.ts";
import { registerSchema, loginSchema, totpVerifySchema } from "../schemas/auth.ts";
import { requireAuth } from "./middleware.ts";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REFRESH_EXPIRY_SECONDS * 1000,
  path: "/api/v1/auth/refresh",
};

function rtKey(userId: string, jti: string) {
  return `rt:${userId}:${jti}`;
}

// ── POST /register ───────────────────────────────────────────────────────────
router.post(
  "/register",
  loginLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { email, password, name, referenceCurrency, timezone, language } = req.body;

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);

      if (existing.length > 0) {
        throw new AppError(409, "Un compte existe déjà avec cet email");
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await db
        .insert(users)
        .values({ email, passwordHash, name, referenceCurrency, timezone, language })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          planType: users.planType,
          referenceCurrency: users.referenceCurrency,
          language: users.language,
        });

      const accessToken = createAccessToken({
        sub: user.id,
        email: user.email,
        planType: user.planType,
      });
      const { token: refreshToken, jti } = createRefreshToken();
      await redis.set(rtKey(user.id, jti), "1", "EX", REFRESH_EXPIRY_SECONDS);

      res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
      res.status(201).json({ accessToken, user });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /login ──────────────────────────────────────────────────────────────
router.post("/login", loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password, totpToken } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (!user) throw new AppError(401, "Email ou mot de passe incorrect");

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) throw new AppError(401, "Email ou mot de passe incorrect");

    if (user.isTotpEnabled) {
      if (!totpToken) throw new AppError(401, "Code 2FA requis");
      const totpValid = verifyTotpToken(user.totpSecret!, totpToken);
      if (!totpValid) throw new AppError(401, "Code 2FA invalide");
    }

    const accessToken = createAccessToken({
      sub: user.id,
      email: user.email,
      planType: user.planType,
    });
    const { token: refreshToken, jti } = createRefreshToken();
    await redis.set(rtKey(user.id, jti), "1", "EX", REFRESH_EXPIRY_SECONDS);

    const { passwordHash: _, totpSecret: __, ...safeUser } = user;

    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    res.json({ accessToken, user: safeUser });
  } catch (err) {
    next(err);
  }
});

// ── POST /refresh ────────────────────────────────────────────────────────────
router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError(401, "Refresh token manquant");

    const { jti } = verifyRefreshToken(token);

    // Le payload du refresh token ne contient que le jti : on récupère l'userId via Redis scan
    // Pour simplifier : on stocke userId dans le jti key value
    const keys = await redis.keys(`rt:*:${jti}`);
    if (keys.length === 0) throw new AppError(401, "Session expirée");

    const userId = keys[0].split(":")[1];
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) throw new AppError(401, "Utilisateur introuvable");

    // Rotation du refresh token
    await redis.del(keys[0]);
    const newAccessToken = createAccessToken({
      sub: user.id,
      email: user.email,
      planType: user.planType,
    });
    const { token: newRefreshToken, jti: newJti } = createRefreshToken();
    await redis.set(rtKey(user.id, newJti), "1", "EX", REFRESH_EXPIRY_SECONDS);

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTS);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
});

// ── POST /logout ─────────────────────────────────────────────────────────────
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const { jti } = verifyRefreshToken(token);
        const keys = await redis.keys(`rt:${req.user!.sub}:${jti}`);
        if (keys.length > 0) await redis.del(...keys);
      } catch {
        // Token déjà expiré, on continue
      }
    }
    res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
    res.json({ message: "Déconnecté avec succès" });
  } catch (err) {
    next(err);
  }
});

// ── PUT /me ───────────────────────────────────────────────────────────────────
router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, referenceCurrency, timezone, language } = req.body;
    const [updated] = await db
      .update(users)
      .set({
        ...(name && { name }),
        ...(referenceCurrency && { referenceCurrency }),
        ...(timezone && { timezone }),
        ...(language && { language }),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, req.user!.sub), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        planType: users.planType,
        referenceCurrency: users.referenceCurrency,
        timezone: users.timezone,
        language: users.language,
        isTotpEnabled: users.isTotpEnabled,
        createdAt: users.createdAt,
      });
    if (!updated) throw new AppError(404, "Utilisateur introuvable");
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── GET /me ───────────────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        planType: users.planType,
        referenceCurrency: users.referenceCurrency,
        timezone: users.timezone,
        language: users.language,
        isTotpEnabled: users.isTotpEnabled,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, req.user!.sub), isNull(users.deletedAt)))
      .limit(1);

    if (!user) throw new AppError(404, "Utilisateur introuvable");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── POST /2fa/setup ───────────────────────────────────────────────────────────
router.post("/2fa/setup", requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ email: users.email, isTotpEnabled: users.isTotpEnabled })
      .from(users)
      .where(eq(users.id, req.user!.sub))
      .limit(1);

    if (!user) throw new AppError(404, "Utilisateur introuvable");
    if (user.isTotpEnabled) throw new AppError(409, "2FA déjà activé");

    const { base32, otpauthUrl } = generateTotpSecret(user.email);
    const qrCode = await generateQrCode(otpauthUrl);

    // Stocke temporairement le secret en attente de confirmation
    await redis.set(`totp:pending:${req.user!.sub}`, base32, "EX", 600);

    res.json({ qrCode, secret: base32 });
  } catch (err) {
    next(err);
  }
});

// ── POST /2fa/verify ──────────────────────────────────────────────────────────
router.post("/2fa/verify", requireAuth, validate(totpVerifySchema), async (req, res, next) => {
  try {
    const pendingSecret = await redis.get(`totp:pending:${req.user!.sub}`);
    if (!pendingSecret) {
      throw new AppError(400, "Aucune configuration 2FA en attente (recommencer /2fa/setup)");
    }

    const valid = verifyTotpToken(pendingSecret, req.body.token);
    if (!valid) throw new AppError(400, "Code TOTP invalide");

    await db
      .update(users)
      .set({ totpSecret: pendingSecret, isTotpEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, req.user!.sub));

    await redis.del(`totp:pending:${req.user!.sub}`);
    res.json({ message: "2FA activé avec succès" });
  } catch (err) {
    next(err);
  }
});

export default router;
