import "dotenv/config";
import fastify from "fastify";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
    logger: process.env.NODE_ENV !== "test"
  });

  await app.register(cookie, {
    secret: process.env.SESSION_SECRET
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildApp();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "127.0.0.1";

  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}
