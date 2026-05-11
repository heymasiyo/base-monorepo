import type { ParsedError, RequestInfo } from "@/types/common";
import type { Context } from "hono";

import bcrypt from "bcryptjs";

export function formatValidationError(errors: ParsedError[]): string {
  return errors
    .map((err) => {
      const field = err.path?.join(".") ?? "unknown";
      return `[${field}] ${err.message}`;
    })
    .join(", ");
}

export function getRequestInfo(c: Context): RequestInfo {
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";

  const userAgent = c.req.header("user-agent") ?? "unknown";

  return {
    ip,
    userAgent,
  };
}

export function hashPassword(password: string) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  return hash;
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as object).length === 0;
  }

  return false;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
