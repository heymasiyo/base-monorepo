import type { Bindings } from "@/types/bindings";
import type { Context } from "hono";

import { bearerAuth } from "hono/bearer-auth";
import { verify } from "hono/jwt";

import { connectDB } from "@/db/client";
import { getSessionByToken } from "@/db/queries/auth";
import { isEmpty } from "@/lib/utils";

export function withBearerAuth() {
  return bearerAuth({
    verifyToken: async (token, c: Context<{ Bindings: Bindings }>) => {
      try {
        const decoded = await verify(token, c.env.JWT_SECRET, "HS256");

        const db = connectDB(c);
        const sessionData = await getSessionByToken(db, token);
        if (isEmpty(sessionData)) {
          throw new Error("Token tidak valid");
        }

        const payload = {
          ...decoded,
          token,
        };
        c.set("jwtPayload", payload);

        return true;
      } catch (error) {
        console.error(error);

        return false;
      }
    },
  });
}
