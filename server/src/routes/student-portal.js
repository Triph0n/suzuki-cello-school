import { randomBytes } from "node:crypto";
import { hashToken, requireTeacher } from "../auth.js";
import { query, transaction } from "../db.js";

export async function registerStudentPortalRoutes(app) {
  // Rotates the student's single private link: generating a new token deletes
  // the previous ones, so the teacher can revoke access just by re-sharing.
  app.post("/api/students/:id/access-token", { preHandler: requireTeacher }, async (request) => {
    const token = randomBytes(32).toString("base64url");

    await transaction(async (client) => {
      const exists = await client.query("SELECT id FROM students WHERE id = $1", [request.params.id]);
      if (!exists.rowCount) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
      }

      await client.query("DELETE FROM student_access_tokens WHERE student_id = $1", [request.params.id]);
      await client.query(
        "INSERT INTO student_access_tokens (student_id, token_hash) VALUES ($1, $2)",
        [request.params.id, hashToken(token)]
      );
    });

    return { token, path: `/portal/${token}` };
  });

  // Public: the token itself is the credential, so no session is required,
  // but the response is scoped to that one student and never includes
  // internal_notes.
  app.get("/api/student-portal/:token", {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: "1 minute",
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: "Too many requests. Try again in a minute."
        })
      }
    }
  }, async (request, reply) => {
    const tokenResult = await query(
      `SELECT student_access_tokens.id AS access_token_id, students.id, students.display_name
       FROM student_access_tokens
       JOIN students ON students.id = student_access_tokens.student_id
       WHERE student_access_tokens.token_hash = $1
         AND (student_access_tokens.expires_at IS NULL OR student_access_tokens.expires_at > now())`,
      [hashToken(String(request.params.token))]
    );

    const row = tokenResult.rows[0];
    if (!row) {
      return reply.code(404).send({ error: "This link is no longer valid" });
    }

    await query(
      "UPDATE student_access_tokens SET last_used_at = now() WHERE id = $1",
      [row.access_token_id]
    );

    const materials = await query(
      "SELECT assignment FROM student_materials WHERE student_id = $1 ORDER BY sort_order",
      [row.id]
    );
    const lessons = await query(
      `SELECT id, lesson_date, note, homework
       FROM lesson_notes
       WHERE student_id = $1
       ORDER BY lesson_date DESC, created_at DESC
       LIMIT 20`,
      [row.id]
    );

    return {
      student: {
        id: row.id,
        name: row.display_name,
        assignedVideos: materials.rows.map((material) => material.assignment)
      },
      lessonNotes: lessons.rows.map((lesson) => ({
        id: lesson.id,
        date: lesson.lesson_date,
        note: lesson.note,
        homework: lesson.homework
      }))
    };
  });
}
