import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { router } from "./procedures";

const app = new Hono();

app.use("/*", cors());

app.route("/rpc", router);

const port = Number(process.env.PORT) || 4500;

console.log(`🚀 API Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
