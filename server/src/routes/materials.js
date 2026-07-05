import { requireTeacher } from "../auth.js";
import { query } from "../db.js";

function mapMaterial(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    type: row.type,
    cloudflareKey: row.cloudflare_key,
    externalUrl: row.external_url,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function registerMaterialRoutes(app) {
  app.get("/api/materials", { preHandler: requireTeacher }, async () => {
    const result = await query("SELECT * FROM materials ORDER BY title ASC");
    return { materials: result.rows.map(mapMaterial) };
  });

  app.post("/api/materials", { preHandler: requireTeacher }, async (request, reply) => {
    const title = String(request.body?.title || "").trim();
    if (!title) {
      return reply.code(400).send({ error: "Material title is required" });
    }

    const result = await query(
      `INSERT INTO materials (title, category, type, cloudflare_key, external_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title,
        String(request.body?.category || "general"),
        String(request.body?.type || request.body?.category || "material"),
        request.body?.cloudflareKey || null,
        request.body?.externalUrl || null,
        request.body?.metadata || {}
      ]
    );

    return { material: mapMaterial(result.rows[0]) };
  });

  app.delete("/api/materials/:id", { preHandler: requireTeacher }, async (request, reply) => {
    const result = await query("DELETE FROM materials WHERE id = $1", [request.params.id]);
    if (!result.rowCount) {
      return reply.code(404).send({ error: "Material not found" });
    }
    return { ok: true };
  });
}
