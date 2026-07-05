import { query } from "../db.js";

export async function registerHealthRoutes(app) {
  app.get("/api/health", async () => {
    let database = "ok";
    try {
      await query("SELECT 1");
    } catch {
      database = "unavailable";
    }

    return {
      status: database === "ok" ? "ok" : "degraded",
      database,
      service: "suzuki-cello-school"
    };
  });
}
