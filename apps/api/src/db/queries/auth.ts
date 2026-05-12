import type { Database } from "@/db/client";

import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { account, member, role, session, user } from "@/db/schema/auth";

const datetime = new Date();

export async function checkUserTableEmpty(db: Database) {
  const result = await db.select({ id: user.id }).from(user).limit(1);

  return result.length === 0;
}

export async function checkEmailExists(db: Database, email: string) {
  const isExists = await db.$count(user, eq(user.email, email));

  return isExists;
}

export type CreateUserParams = {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
};

export async function createUser(db: Database, params: CreateUserParams) {
  const [result] = await db
    .insert(user)
    .values({
      id: uuidv4(),
      name: params.name,
      email: params.email,
      emailVerified: params.emailVerified,
      image: params.image,
      createdAt: datetime,
      updatedAt: datetime,
    })
    .returning();

  return result;
}

export type CreateEmailAccountParams = {
  userId: string;
  password: string;
};

export async function createEmailAccount(
  db: Database,
  params: CreateEmailAccountParams
) {
  const [result] = await db
    .insert(account)
    .values({
      id: uuidv4(),
      userId: params.userId,
      accountId: params.userId,
      providerId: "email",
      password: params.password,
      createdAt: datetime,
      updatedAt: datetime,
    })
    .returning();

  return result;
}

export type CreateRoleParams = {
  name: string;
  superuser: boolean;
  permission: string;
};

export async function createRole(db: Database, params: CreateRoleParams) {
  const [result] = await db
    .insert(role)
    .values({
      id: uuidv4(),
      name: params.name,
      superuser: params.superuser,
      permission: params.permission,
      createdAt: datetime,
      updatedAt: datetime,
    })
    .returning();

  return result;
}

export type CreateMemberParams = {
  userId: string;
  roleId: string;
};

export async function createMember(db: Database, params: CreateMemberParams) {
  const [result] = await db
    .insert(member)
    .values({
      id: uuidv4(),
      userId: params.userId,
      roleId: params.roleId,
      createdAt: datetime,
      updatedAt: datetime,
    })
    .returning();

  return result;
}

export async function getUserCredentialsByEmail(db: Database, email: string) {
  const [result] = await db
    .select({
      id: user.id,
      password: account.password,
    })
    .from(user)
    .innerJoin(account, eq(account.userId, user.id))
    .where(and(eq(user.email, email), eq(account.providerId, "email")));

  return result;
}

export type CreateSessionParams = {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export async function createSession(db: Database, params: CreateSessionParams) {
  const [result] = await db
    .insert(session)
    .values({
      id: uuidv4(),
      userId: params.userId,
      token: params.token,
      expiresAt: params.expiresAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: datetime,
      updatedAt: datetime,
    })
    .returning();

  return result;
}

export async function getSessionByToken(db: Database, token: string) {
  const [result] = await db
    .select({
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })
    .from(session)
    .where(eq(session.token, token));

  return result;
}

export async function deleteSessionByToken(db: Database, token: string) {
  const [result] = await db
    .delete(session)
    .where(eq(session.token, token))
    .returning();

  return result;
}
