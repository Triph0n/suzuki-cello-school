import { requireTeacher } from "../auth.js";
import { query, transaction } from "../db.js";

export async function registerAdminRoutes(app) {
  app.get("/api/admin/export", { preHandler: requireTeacher }, async () => {
    const [students, materials, attendances] = await Promise.all([
      query(
        `SELECT
           students.id,
           students.display_name AS name,
           COALESCE(
             jsonb_agg(student_materials.assignment ORDER BY student_materials.sort_order)
               FILTER (WHERE student_materials.id IS NOT NULL),
             '[]'::jsonb
           ) AS "assignedVideos"
         FROM students
         LEFT JOIN student_materials ON student_materials.student_id = students.id
         GROUP BY students.id
         ORDER BY students.display_name ASC`
      ),
      query("SELECT id, title, category, type FROM materials ORDER BY title ASC"),
      query("SELECT id, student_id AS \"studentId\", lesson_date AS date, note FROM lesson_notes ORDER BY lesson_date DESC")
    ]);

    return {
      students: students.rows,
      materials: materials.rows,
      attendances: attendances.rows
    };
  });

  app.post("/api/admin/import", { preHandler: requireTeacher }, async (request) => {
    const payload = request.body || {};

    await transaction(async (client) => {
      await client.query("DELETE FROM lesson_notes");
      await client.query("DELETE FROM student_materials");
      await client.query("DELETE FROM materials");
      await client.query("DELETE FROM students");

      for (const student of payload.students || []) {
        await client.query(
          "INSERT INTO students (id, display_name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET display_name = excluded.display_name",
          [student.id, student.name]
        );
        for (const [index, assignment] of (student.assignedVideos || []).entries()) {
          await client.query(
            "INSERT INTO student_materials (student_id, sort_order, assignment) VALUES ($1, $2, $3)",
            [student.id, index, assignment]
          );
        }
      }

      for (const material of payload.materials || []) {
        await client.query(
          `INSERT INTO materials (id, title, category, type)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE
           SET title = excluded.title,
               category = excluded.category,
               type = excluded.type`,
          [material.id, material.title, material.category || "general", material.type || material.category || "material"]
        );
      }

      for (const attendance of payload.attendances || []) {
        await client.query(
          `INSERT INTO lesson_notes (id, student_id, lesson_date, note)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE
           SET lesson_date = excluded.lesson_date,
               note = excluded.note`,
          [attendance.id, attendance.studentId, attendance.date, attendance.note || ""]
        );
      }
    });

    return { ok: true };
  });

  app.post("/api/admin/reset", { preHandler: requireTeacher }, async () => {
    await transaction(async (client) => {
      await client.query("DELETE FROM lesson_notes");
      await client.query("DELETE FROM student_materials");
      await client.query("DELETE FROM materials");
      await client.query("DELETE FROM students");
    });

    return { ok: true };
  });
}
