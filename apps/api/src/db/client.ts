import type { Bindings } from "@/types/bindings";
import type { Context } from "hono";

import { drizzle } from "drizzle-orm/d1";

export function connectDB(c: Context<{ Bindings: Bindings }>) {
  const db = drizzle(c.env.DB);

  return db;
}

export type Database = ReturnType<typeof connectDB>;
