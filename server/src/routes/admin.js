import { randomUUID } from "node:crypto";
import { requireTeacher } from "../auth.js";
import { query, transaction } from "../db.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}/;

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

// Local backups carry Date.now() string ids; the database needs UUIDs.
// Existing UUIDs are kept so a server export re-imports losslessly.
function ensureUuid(id, idMap) {
  const key = String(id ?? "");
  if (UUID_RE.test(key)) return key;
  if (!idMap.has(key)) idMap.set(key, randomUUID());
  return idMap.get(key);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw badRequest("Import payload must be a JSON object");
  }
  const students = payload.students ?? [];
  const materials = payload.materials ?? [];
  const attendances = payload.attendances ?? [];

  if (!Array.isArray(students) || !Array.isArray(materials) || !Array.isArray(attendances)) {
    throw badRequest("students, materials, and attendances must be arrays");
  }
  for (const student of students) {
    if (!student || typeof student.name !== "string" || !student.name.trim()) {
      throw badRequest("Every student needs a non-empty name");
    }
    if (student.assignedVideos !== undefined && !Array.isArray(student.assignedVideos)) {
      throw badRequest(`Student "${student.name}": assignedVideos must be an array`);
    }
  }
  for (const material of materials) {
    if (!material || typeof material.title !== "string" || !material.title.trim()) {
      throw badRequest("Every material needs a non-empty title");
    }
  }
  const studentIds = new Set(students.map((student) => String(student.id ?? "")));
  for (const attendance of attendances) {
    if (!attendance || !DATE_RE.test(String(attendance.date ?? ""))) {
      throw badRequest("Every lesson record needs a date in YYYY-MM-DD format");
    }
    if (!studentIds.has(String(attendance.studentId ?? ""))) {
      throw badRequest(`Lesson record ${attendance.date} references an unknown student id`);
    }
  }
  return { students, materials, attendances };
}

export async function registerAdminRoutes(app) {
  app.get("/api/admin/export", { preHandler: requireTeacher }, async () => {
    const [students, materials, attendances] = await Promise.all([
      query(
        `SELECT
           students.id,
           students.display_name AS name,
           students.status,
           students.internal_notes AS "internalNotes",
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
      query(
        `SELECT id, title, category, type,
                cloudflare_key AS "cloudflareKey",
                external_url AS "externalUrl",
                metadata
         FROM materials ORDER BY title ASC`
      ),
      query(
        `SELECT id,
                student_id AS "studentId",
                to_char(lesson_date, 'YYYY-MM-DD') AS date,
                note, homework, focus,
                attendance_status AS "attendanceStatus"
         FROM lesson_notes ORDER BY lesson_date DESC`
      )
    ]);

    return {
      exportedAt: new Date().toISOString(),
      students: students.rows,
      materials: materials.rows,
      attendances: attendances.rows
    };
  });

  app.post("/api/admin/import", { preHandler: requireTeacher }, async (request) => {
    const { students, materials, attendances } = validatePayload(request.body);
    const studentIdMap = new Map();
    const materialIdMap = new Map();
    const attendanceIdMap = new Map();

    await transaction(async (client) => {
      await client.query("DELETE FROM lesson_notes");
      await client.query("DELETE FROM student_materials");
      await client.query("DELETE FROM materials");
      await client.query("DELETE FROM students");

      for (const student of students) {
        const id = ensureUuid(student.id, studentIdMap);
        await client.query(
          `INSERT INTO students (id, display_name, status, internal_notes)
           VALUES ($1, $2, $3, $4)`,
          [
            id,
            student.name.trim(),
            student.status === "inactive" ? "inactive" : "active",
            typeof student.internalNotes === "string" ? student.internalNotes : ""
          ]
        );
        for (const [index, assignment] of (student.assignedVideos || []).entries()) {
          await client.query(
            "INSERT INTO student_materials (student_id, sort_order, assignment) VALUES ($1, $2, $3)",
            [id, index, assignment]
          );
        }
      }

      for (const material of materials) {
        await client.query(
          `INSERT INTO materials (id, title, category, type, cloudflare_key, external_url, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            ensureUuid(material.id, materialIdMap),
            material.title.trim(),
            material.category || "general",
            material.type || material.category || "material",
            material.cloudflareKey ?? null,
            material.externalUrl ?? null,
            material.metadata && typeof material.metadata === "object" ? material.metadata : {}
          ]
        );
      }

      const validStatuses = new Set(["present", "missed", "cancelled"]);
      for (const attendance of attendances) {
        await client.query(
          `INSERT INTO lesson_notes (id, student_id, lesson_date, note, homework, focus, attendance_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            ensureUuid(attendance.id, attendanceIdMap),
            ensureUuid(attendance.studentId, studentIdMap),
            String(attendance.date).slice(0, 10),
            typeof attendance.note === "string" ? attendance.note : "",
            typeof attendance.homework === "string" ? attendance.homework : "",
            typeof attendance.focus === "string" ? attendance.focus : "",
            validStatuses.has(attendance.attendanceStatus) ? attendance.attendanceStatus : "present"
          ]
        );
      }
    });

    return {
      ok: true,
      imported: {
        students: students.length,
        materials: materials.length,
        attendances: attendances.length
      }
    };
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
