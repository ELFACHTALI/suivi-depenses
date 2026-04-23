import speakeasy from "speakeasy";
import QRCode from "qrcode";

const APP_NAME = "Fintrack";

export function generateTotpSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME}:${email}`,
    length: 20,
  });
  return {
    base32: secret.base32!,
    otpauthUrl: secret.otpauth_url!,
  };
}

export async function generateQrCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTotpToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // ±30 secondes de tolérance
  });
}
