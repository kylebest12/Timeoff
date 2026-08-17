import crypto from "node:crypto";

export function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}
