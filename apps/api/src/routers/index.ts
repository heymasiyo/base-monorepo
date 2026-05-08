import { Hono } from "hono";

import coreRouter from "@/routers/core";

const routers = new Hono();

routers.route("/core/v1", coreRouter);

export default routers;
