import type { Bindings } from "@/types/bindings";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { connectDB } from "@/db/client";
import {
  checkEmailExists,
  checkUserTableEmpty,
  createEmailAccount,
  createMember,
  createRole,
  createUser,
} from "@/db/queries/auth";
import { hashPassword } from "@/lib/utils";
import { withBasicAuth } from "@/middleware/basic-auth";
import { zValidator } from "@/middleware/zod-validator";
import { signUpEmailSchema } from "@/schemas/auth";

const authRouter = new Hono<{ Bindings: Bindings }>();

authRouter.post(
  "/sign-up/email",
  withBasicAuth(),
  zValidator("json", signUpEmailSchema),
  async (c) => {
    const db = connectDB(c);
    const body = c.req.valid("json");

    const userTableEmpty = await checkUserTableEmpty(db);
    if (!userTableEmpty) {
      throw new HTTPException(400, {
        message: "Pendaftaran ditolak. Silahkan bergabung melalui undangan",
      });
    }

    const emailExists = await checkEmailExists(db, body.email);
    if (emailExists > 0) {
      throw new HTTPException(400, {
        message: "Email sudah digunakan",
      });
    }

    const userData = await createUser(db, {
      name: body.name,
      email: body.email,
      emailVerified: true,
    });

    await createEmailAccount(db, {
      userId: userData.id,
      password: hashPassword(body.password),
    });

    const roleData = await createRole(db, {
      name: "Administrator",
      superuser: true,
      permission: JSON.stringify([]),
    });

    await createMember(db, {
      userId: userData.id,
      roleId: roleData.id,
    });

    return c.json(
      {
        message: "Pendaftaran berhasil",
      },
      200
    );
  }
);

export default authRouter;
