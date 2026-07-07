import "dotenv/config";
import fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getSessionSecret } from "./auth.js";
import { closePool, getPool } from "./db.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerAuthRoutes } from "./routes/auth-routes.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerLessonNoteRoutes } from "./routes/lesson-notes.js";
import { registerMaterialRoutes } from "./routes/materials.js";
import { registerStudentRoutes } from "./routes/students.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildApp() {
  const app = fastify({
    logger: process.env.NODE_ENV !== "test",
    // Caddy terminates TLS in front of us; without this every request.ip
    // would be the proxy container's address and per-IP rate limits would
    // throttle all users collectively.
    trustProxy: true
  });

  await app.register(cookie, {
    secret: getSessionSecret()
  });

  // Registered globally but disabled by default; individual routes opt in
  // via config.rateLimit (login does).
  await app.register(rateLimit, { global: false });

  // Never leak internal error details (pg messages, stack traces) to clients.
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    if (statusCode >= 500) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
    return reply.code(statusCode).send({ error: error.message });
  });

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerStudentRoutes(app);
  await registerMaterialRoutes(app);
  await registerLessonNoteRoutes(app);
  await registerAdminRoutes(app);

  const distRoot = process.env.FRONTEND_DIST || path.resolve(__dirname, "../../dist");
  if (existsSync(distRoot)) {
    await app.register(fastifyStatic, {
      root: distRoot,
      prefix: "/"
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not found" });
      }
      return reply.sendFile("index.html");
    });
  }

  return app;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const app = await buildApp();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "127.0.0.1";

  // A Postgres restart or network blip emits 'error' on idle pool clients;
  // without a handler that would crash the whole process.
  getPool().on("error", (error) => {
    app.log.error({ err: error }, "postgres pool error");
  });

  const shutdown = async (signal) => {
    app.log.info(`${signal} received, shutting down`);
    try {
      await app.close();
      await closePool();
      process.exit(0);
    } catch (error) {
      app.log.error(error);
      process.exit(1);
    }
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}
