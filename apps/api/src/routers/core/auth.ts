import type { Bindings } from "@/types/bindings";
import type { JWTPayload } from "hono/utils/jwt/types";

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";

import { connectDB } from "@/db/client";
import {
  checkEmailExists,
  checkUserTableEmpty,
  createEmailAccount,
  createMember,
  createRole,
  createSession,
  createUser,
  deleteSessionByToken,
  deleteSessionByUserId,
  getUserCredentialsByEmail,
  getUserCredentialsById,
  updatePasswordAccount,
} from "@/db/queries/auth";
import {
  getRequestInfo,
  hashPassword,
  isEmpty,
  verifyPassword,
} from "@/lib/utils";
import { withBasicAuth } from "@/middleware/basic-auth";
import { withBearerAuth } from "@/middleware/bearer-auth";
import { zValidator } from "@/middleware/zod-validator";
import {
  changePasswordSchema,
  signInEmailSchema,
  signUpEmailSchema,
} from "@/schemas/auth";

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

authRouter.post(
  "/sign-in/email",
  withBasicAuth(),
  zValidator("json", signInEmailSchema),
  async (c) => {
    const db = connectDB(c);
    const body = c.req.valid("json");

    const userCredentials = await getUserCredentialsByEmail(db, body.email);
    if (isEmpty(userCredentials)) {
      throw new HTTPException(400, {
        message: "Email atau password salah",
      });
    }

    if (!verifyPassword(body.password, userCredentials.password as string)) {
      throw new HTTPException(400, {
        message: "Email atau password salah",
      });
    }

    const timestampToken = Math.floor(Date.now() / 1000);
    const expiresAt = timestampToken + 30 * 24 * 60 * 60;
    const expiresAtStr = new Date(expiresAt * 1000);

    const { ip, userAgent } = getRequestInfo(c);
    const token = await sign(
      {
        exp: expiresAt,
        nbf: timestampToken,
        iat: timestampToken,
        iss: c.env.APP_NAME,
        aud: userCredentials.id,
      },
      c.env.JWT_SECRET
    );

    await createSession(db, {
      userId: userCredentials.id,
      token,
      expiresAt: expiresAtStr,
      ipAddress: ip,
      userAgent,
    });

    return c.json(
      {
        message: "Log in berhasil",
        data: {
          token,
        },
      },
      200
    );
  }
);

authRouter.post("/sign-out", withBearerAuth(), async (c) => {
  const db = connectDB(c);
  const session = c.get("jwtPayload") as JWTPayload;

  await deleteSessionByToken(db, session.token as string);

  return c.json(
    {
      message: "Log out berhasil",
    },
    200
  );
});

authRouter.post(
  "/change-password",
  withBearerAuth(),
  zValidator("json", changePasswordSchema),
  async (c) => {
    const db = connectDB(c);
    const session = c.get("jwtPayload") as JWTPayload;
    const body = c.req.valid("json");

    const userCredentials = await getUserCredentialsById(
      db,
      session.aud as string
    );
    if (
      !verifyPassword(body.currentPassword, userCredentials.password as string)
    ) {
      throw new HTTPException(400, {
        message: "Password lama salah",
      });
    }

    await updatePasswordAccount(db, {
      userId: session.aud as string,
      password: hashPassword(body.newPassword),
    });

    if (body.revokeOtherSessions) {
      await deleteSessionByUserId(db, session.aud as string);
    }

    return c.json(
      {
        message: "Ubah password berhasil",
      },
      200
    );
  }
);

export default authRouter;
