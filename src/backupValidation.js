// Structural validation for backup files before they overwrite any data.
// Returns { ok: true, payload } with only the recognized keys, or
// { ok: false, error } describing the first problem found.

const isId = (value) => typeof value === "string" || typeof value === "number";

const validators = {
  students(student, i) {
    if (!student || typeof student !== "object") return `students[${i}] is not an object`;
    if (!isId(student.id)) return `students[${i}] is missing an id`;
    if (typeof student.name !== "string" || !student.name.trim()) return `students[${i}] is missing a name`;
    if (student.assignedVideos !== undefined) {
      if (!Array.isArray(student.assignedVideos)) return `students[${i}].assignedVideos is not an array`;
      for (const [j, video] of student.assignedVideos.entries()) {
        if (!video || typeof video !== "object" || typeof video.title !== "string") {
          return `students[${i}].assignedVideos[${j}] is missing a title`;
        }
      }
    }
    return null;
  },
  materials(material, i) {
    if (!material || typeof material !== "object") return `materials[${i}] is not an object`;
    if (!isId(material.id)) return `materials[${i}] is missing an id`;
    if (typeof material.title !== "string" || !material.title.trim()) return `materials[${i}] is missing a title`;
    return null;
  },
  attendances(attendance, i) {
    if (!attendance || typeof attendance !== "object") return `attendances[${i}] is not an object`;
    if (!isId(attendance.id)) return `attendances[${i}] is missing an id`;
    if (!isId(attendance.studentId)) return `attendances[${i}] is missing a studentId`;
    if (typeof attendance.date !== "string" || Number.isNaN(Date.parse(attendance.date))) {
      return `attendances[${i}] has an invalid date`;
    }
    return null;
  },
};

export function validateBackupPayload(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return { ok: false, error: "Invalid file content format." };
  }

  const payload = {};
  for (const key of Object.keys(validators)) {
    if (json[key] === undefined) continue;
    if (!Array.isArray(json[key])) {
      return { ok: false, error: `"${key}" is not an array.` };
    }
    for (const [i, record] of json[key].entries()) {
      const error = validators[key](record, i);
      if (error) return { ok: false, error };
    }
    payload[key] = json[key];
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "File does not contain valid backup data." };
  }
  return { ok: true, payload };
}
