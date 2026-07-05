import { requireTeacher } from "../auth.js";
import { query } from "../db.js";

function mapLesson(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.lesson_date,
    note: row.note,
    homework: row.homework,
    focus: row.focus,
    attendanceStatus: row.attendance_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function registerLessonNoteRoutes(app) {
  app.get("/api/lesson-notes", { preHandler: requireTeacher }, async (request) => {
    const params = [];
    let where = "";
    if (request.query?.studentId) {
      params.push(request.query.studentId);
      where = "WHERE student_id = $1";
    }

    const result = await query(
      `SELECT * FROM lesson_notes ${where} ORDER BY lesson_date DESC, created_at DESC`,
      params
    );
    return { attendances: result.rows.map(mapLesson) };
  });

  app.post("/api/lesson-notes", { preHandler: requireTeacher }, async (request, reply) => {
    const studentId = request.body?.studentId;
    const date = request.body?.date;
    if (!studentId || !date) {
      return reply.code(400).send({ error: "studentId and date are required" });
    }

    const result = await query(
      `INSERT INTO lesson_notes (student_id, lesson_date, note, homework, focus, attendance_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        studentId,
        date,
        String(request.body?.note || ""),
        String(request.body?.homework || ""),
        String(request.body?.focus || ""),
        String(request.body?.attendanceStatus || "present")
      ]
    );

    return { attendance: mapLesson(result.rows[0]) };
  });

  app.patch("/api/lesson-notes/:id", { preHandler: requireTeacher }, async (request, reply) => {
    const result = await query(
      `UPDATE lesson_notes
       SET lesson_date = COALESCE($1, lesson_date),
           note = COALESCE($2, note),
           homework = COALESCE($3, homework),
           focus = COALESCE($4, focus),
           attendance_status = COALESCE($5, attendance_status),
           updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [
        request.body?.date || request.body?.newDate || null,
        request.body?.note || request.body?.newNote || null,
        request.body?.homework || null,
        request.body?.focus || null,
        request.body?.attendanceStatus || null,
        request.params.id
      ]
    );

    if (!result.rowCount) {
      return reply.code(404).send({ error: "Lesson note not found" });
    }
    return { attendance: mapLesson(result.rows[0]) };
  });

  app.delete("/api/lesson-notes/:id", { preHandler: requireTeacher }, async (request, reply) => {
    const result = await query("DELETE FROM lesson_notes WHERE id = $1", [request.params.id]);
    if (!result.rowCount) {
      return reply.code(404).send({ error: "Lesson note not found" });
    }
    return { ok: true };
  });
}
