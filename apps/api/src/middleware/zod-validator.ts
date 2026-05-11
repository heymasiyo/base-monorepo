import type { ValidationTargets } from "hono";

import { zValidator as zv } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { formatValidationError } from "@/lib/utils";

export const zValidator = <
  T extends z.ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result, _) => {
    if (!result.success) {
      const errorParse = JSON.parse(result.error.message);

      throw new HTTPException(400, {
        message: formatValidationError(errorParse),
      });
    }
  });
