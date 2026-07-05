import { requireTeacher } from "../auth.js";
import { query, transaction } from "../db.js";

function mapStudent(row) {
  return {
    id: row.id,
    name: row.display_name,
    status: row.status,
    internalNotes: row.internal_notes,
    assignedVideos: row.assigned_videos || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listStudents() {
  const result = await query(
    `SELECT
       students.*,
       COALESCE(
         jsonb_agg(student_materials.assignment ORDER BY student_materials.sort_order)
           FILTER (WHERE student_materials.id IS NOT NULL),
         '[]'::jsonb
       ) AS assigned_videos
     FROM students
     LEFT JOIN student_materials ON student_materials.student_id = students.id
     GROUP BY students.id
     ORDER BY students.display_name ASC`
  );
  return result.rows.map(mapStudent);
}

export async function registerStudentRoutes(app) {
  app.get("/api/students", { preHandler: requireTeacher }, async () => {
    return { students: await listStudents() };
  });

  app.post("/api/students", { preHandler: requireTeacher }, async (request, reply) => {
    const name = String(request.body?.name || "").trim();
    if (!name) {
      return reply.code(400).send({ error: "Student name is required" });
    }

    const result = await query(
      "INSERT INTO students (display_name) VALUES ($1) RETURNING *",
      [name]
    );
    return { student: mapStudent({ ...result.rows[0], assigned_videos: [] }) };
  });

  app.patch("/api/students/:id", { preHandler: requireTeacher }, async (request, reply) => {
    const fields = [];
    const values = [];

    if (request.body?.name !== undefined) {
      fields.push(`display_name = $${fields.length + 1}`);
      values.push(String(request.body.name).trim());
    }
    if (request.body?.status !== undefined) {
      fields.push(`status = $${fields.length + 1}`);
      values.push(String(request.body.status));
    }
    if (request.body?.internalNotes !== undefined) {
      fields.push(`internal_notes = $${fields.length + 1}`);
      values.push(String(request.body.internalNotes));
    }

    if (!fields.length) {
      return reply.code(400).send({ error: "No fields to update" });
    }

    fields.push("updated_at = now()");
    values.push(request.params.id);

    const result = await query(
      `UPDATE students SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!result.rowCount) {
      return reply.code(404).send({ error: "Student not found" });
    }

    return { student: mapStudent({ ...result.rows[0], assigned_videos: [] }) };
  });

  app.delete("/api/students/:id", { preHandler: requireTeacher }, async (request, reply) => {
    const result = await query("DELETE FROM students WHERE id = $1", [request.params.id]);
    if (!result.rowCount) {
      return reply.code(404).send({ error: "Student not found" });
    }
    return { ok: true };
  });

  app.put("/api/students/:id/materials", { preHandler: requireTeacher }, async (request, reply) => {
    const assignedVideos = Array.isArray(request.body?.assignedVideos) ? request.body.assignedVideos : null;
    if (!assignedVideos) {
      return reply.code(400).send({ error: "assignedVideos must be an array" });
    }

    await transaction(async (client) => {
      const exists = await client.query("SELECT id FROM students WHERE id = $1", [request.params.id]);
      if (!exists.rowCount) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
      }

      await client.query("DELETE FROM student_materials WHERE student_id = $1", [request.params.id]);
      for (const [index, assignment] of assignedVideos.entries()) {
        await client.query(
          "INSERT INTO student_materials (student_id, sort_order, assignment) VALUES ($1, $2, $3)",
          [request.params.id, index, assignment]
        );
      }
    });

    return { ok: true };
  });
}
