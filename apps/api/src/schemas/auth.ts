import { z } from "zod";

export const signUpEmailSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const signInEmailSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});
