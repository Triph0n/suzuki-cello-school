import { query } from "../db.js";

export async function registerHealthRoutes(app) {
  app.get("/api/health", async (request, reply) => {
    let database = "ok";
    try {
      await query("SELECT 1");
    } catch {
      database = "unavailable";
    }

    const healthy = database === "ok";
    return reply.code(healthy ? 200 : 503).send({
      status: healthy ? "ok" : "degraded",
      database,
      service: "suzuki-cello-school"
    });
  });
}
