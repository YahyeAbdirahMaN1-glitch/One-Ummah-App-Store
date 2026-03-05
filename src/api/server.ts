import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { router } from "./procedures";

const app = new Hono();

app.use("/*", cors({
  origin: '*', // Allow all origins including iOS app
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route("/rpc", router);

const port = Number(process.env.API_PORT || process.env.PORT) + 1 || 4501;

console.log(`🚀 API Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
