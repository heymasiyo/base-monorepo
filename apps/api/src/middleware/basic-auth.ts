import type { Bindings } from "@/types/bindings";
import type { Context } from "hono";

import { basicAuth } from "hono/basic-auth";

export function withBasicAuth() {
  return basicAuth({
    verifyUser: (username, password, c: Context<{ Bindings: Bindings }>) => {
      return (
        username === c.env.BASIC_AUTH_USERNAME &&
        password === c.env.BASIC_AUTH_PASSWORD
      );
    },
  });
}
