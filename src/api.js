const DATA_BACKEND = import.meta.env.VITE_DATA_BACKEND || "local";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const USE_SERVER = DATA_BACKEND === "server";

export const usesServerBackend = () => USE_SERVER;

const serverCache = {
  students: [],
  materials: [],
  attendances: []
};

const notify = (eventName) => {
  window.dispatchEvent(new Event(eventName));
};

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) message = errorBody.error;
    } catch {
      // Keep the status-based error.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

const getLocalStudents = () => {
  const students = localStorage.getItem("local_students");
  return students ? JSON.parse(students) : [];
};

const saveLocalStudents = (students) => {
  localStorage.setItem("local_students", JSON.stringify(students));
  notify("students_updated");
};

const getLocalMaterials = () => {
  const materials = localStorage.getItem("local_materials");
  return materials ? JSON.parse(materials) : [];
};

const saveLocalMaterials = (materials) => {
  localStorage.setItem("local_materials", JSON.stringify(materials));
  notify("materials_updated");
};

const getLocalAttendances = () => {
  const attendances = localStorage.getItem("local_attendances");
  return attendances ? JSON.parse(attendances) : [];
};

const saveLocalAttendances = (attendances) => {
  localStorage.setItem("local_attendances", JSON.stringify(attendances));
  notify("attendances_updated");
};

async function refreshStudents() {
  if (!USE_SERVER) return getLocalStudents();
  const payload = await apiFetch("/api/students");
  serverCache.students = payload.students || [];
  return serverCache.students;
}

async function refreshMaterials() {
  if (!USE_SERVER) return getLocalMaterials();
  const payload = await apiFetch("/api/materials");
  serverCache.materials = payload.materials || [];
  return serverCache.materials;
}

async function refreshAttendances() {
  if (!USE_SERVER) return getLocalAttendances();
  const payload = await apiFetch("/api/lesson-notes");
  serverCache.attendances = payload.attendances || [];
  return serverCache.attendances;
}

function subscribe(eventName, loader, callback) {
  let active = true;
  const run = async () => {
    try {
      const data = await loader();
      if (active) callback(data);
    } catch (error) {
      console.warn(`Failed to load ${eventName}`, error);
      if (active) callback([]);
    }
  };

  const handler = () => {
    run();
  };

  run();
  window.addEventListener(eventName, handler);

  return () => {
    active = false;
    window.removeEventListener(eventName, handler);
  };
}

// -- AUTH API (server mode only) --

export const login = async (email, password) => {
  const payload = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  notify("students_updated");
  notify("materials_updated");
  notify("attendances_updated");
  return payload.user;
};

export const logout = async () => {
  await apiFetch("/api/auth/logout", { method: "POST" });
  serverCache.students = [];
  serverCache.materials = [];
  serverCache.attendances = [];
};

export const getCurrentUser = async () => {
  if (!USE_SERVER) return null;
  const payload = await apiFetch("/api/auth/me");
  return payload.user;
};

// -- STUDENTS API --

export const getStudents = () => {
  return USE_SERVER ? serverCache.students : getLocalStudents();
};

export const subscribeToStudents = (callback) => {
  return subscribe("students_updated", refreshStudents, callback);
};

export const addStudent = async (name) => {
  if (USE_SERVER) {
    await apiFetch("/api/students", {
      method: "POST",
      body: JSON.stringify({ name })
    });
    notify("students_updated");
    return;
  }

  const students = getLocalStudents();
  students.push({ id: Date.now().toString(), name, assignedVideos: [] });
  saveLocalStudents(students);
};

export const deleteStudent = async (studentId) => {
  if (USE_SERVER) {
    await apiFetch(`/api/students/${encodeURIComponent(studentId)}`, { method: "DELETE" });
    notify("students_updated");
    notify("attendances_updated");
    return;
  }

  const students = getLocalStudents().filter((student) => student.id !== studentId);
  saveLocalStudents(students);
};

export const editStudent = async (studentId, newName) => {
  if (USE_SERVER) {
    await apiFetch(`/api/students/${encodeURIComponent(studentId)}`, {
      method: "PATCH",
      body: JSON.stringify({ name: newName })
    });
    notify("students_updated");
    return;
  }

  const students = getLocalStudents().map((student) =>
    student.id === studentId ? { ...student, name: newName } : student
  );
  saveLocalStudents(students);
};

export const updateStudentVideos = async (studentId, assignedVideos) => {
  if (USE_SERVER) {
    await apiFetch(`/api/students/${encodeURIComponent(studentId)}/materials`, {
      method: "PUT",
      body: JSON.stringify({ assignedVideos })
    });
    notify("students_updated");
    return;
  }

  const students = getLocalStudents().map((student) =>
    student.id === studentId ? { ...student, assignedVideos } : student
  );
  saveLocalStudents(students);
};

export const importStudent = async (student) => {
  const students = getStudents();
  const index = students.findIndex((existing) => existing.id === student.id);
  const nextStudent = {
    ...student,
    assignedVideos: student.assignedVideos || []
  };

  if (index > -1) {
    students[index] = {
      ...students[index],
      name: nextStudent.name,
      assignedVideos: nextStudent.assignedVideos
    };
  } else {
    students.push(nextStudent);
  }

  if (USE_SERVER) {
    serverCache.students = [...students];
    notify("students_updated");
    return;
  }

  saveLocalStudents(students);
};

// -- TEACHER MATERIALS API --

export const getMaterials = () => {
  return USE_SERVER ? serverCache.materials : getLocalMaterials();
};

export const subscribeToMaterials = (callback) => {
  return subscribe("materials_updated", refreshMaterials, callback);
};

export const addMaterial = async (materialData) => {
  if (USE_SERVER) {
    await apiFetch("/api/materials", {
      method: "POST",
      body: JSON.stringify(materialData)
    });
    notify("materials_updated");
    return;
  }

  const materials = getLocalMaterials();
  materials.push({ id: Date.now().toString(), ...materialData });
  saveLocalMaterials(materials);
};

export const deleteMaterial = async (materialId) => {
  if (USE_SERVER) {
    await apiFetch(`/api/materials/${encodeURIComponent(materialId)}`, { method: "DELETE" });
    notify("materials_updated");
    return;
  }

  const materials = getLocalMaterials().filter((material) => material.id !== materialId);
  saveLocalMaterials(materials);
};

// -- ATTENDANCE API --

export const getAttendances = () => {
  return USE_SERVER ? serverCache.attendances : getLocalAttendances();
};

export const subscribeToAttendances = (callback) => {
  return subscribe("attendances_updated", refreshAttendances, callback);
};

export const addAttendance = async (studentId, date, note) => {
  if (USE_SERVER) {
    await apiFetch("/api/lesson-notes", {
      method: "POST",
      body: JSON.stringify({ studentId, date, note })
    });
    notify("attendances_updated");
    return;
  }

  const attendances = getLocalAttendances();
  attendances.push({
    id: Date.now().toString(),
    studentId,
    date,
    note
  });
  saveLocalAttendances(attendances);
};

export const deleteAttendance = async (attendanceId) => {
  if (USE_SERVER) {
    await apiFetch(`/api/lesson-notes/${encodeURIComponent(attendanceId)}`, { method: "DELETE" });
    notify("attendances_updated");
    return;
  }

  const attendances = getLocalAttendances().filter((attendance) => attendance.id !== attendanceId);
  saveLocalAttendances(attendances);
};

export const editAttendance = async (attendanceId, newDate, newNote) => {
  if (USE_SERVER) {
    await apiFetch(`/api/lesson-notes/${encodeURIComponent(attendanceId)}`, {
      method: "PATCH",
      body: JSON.stringify({ newDate, newNote })
    });
    notify("attendances_updated");
    return;
  }

  const attendances = getLocalAttendances().map((attendance) =>
    attendance.id === attendanceId
      ? { ...attendance, date: newDate, note: newNote }
      : attendance
  );
  saveLocalAttendances(attendances);
};

// -- DATABASE IMPORT/EXPORT & RESET API --

export const exportDatabasePayload = async () => {
  if (USE_SERVER) {
    return apiFetch("/api/admin/export");
  }
  return {
    students: getStudents(),
    materials: getMaterials(),
    attendances: getAttendances()
  };
};

export const importDatabasePayload = async (payload) => {
  if (USE_SERVER) {
    await apiFetch("/api/admin/import", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    notify("students_updated");
    notify("materials_updated");
    notify("attendances_updated");
    return;
  }

  if (payload.students) {
    localStorage.setItem("local_students", JSON.stringify(payload.students));
  }
  if (payload.materials) {
    localStorage.setItem("local_materials", JSON.stringify(payload.materials));
  }
  if (payload.attendances) {
    localStorage.setItem("local_attendances", JSON.stringify(payload.attendances));
  }

  notify("students_updated");
  notify("materials_updated");
  notify("attendances_updated");
};

export const resetDatabase = async () => {
  if (USE_SERVER) {
    await apiFetch("/api/admin/reset", { method: "POST" });
    serverCache.students = [];
    serverCache.materials = [];
    serverCache.attendances = [];
    notify("students_updated");
    notify("materials_updated");
    notify("attendances_updated");
    return;
  }

  localStorage.removeItem("local_students");
  localStorage.removeItem("local_materials");
  localStorage.removeItem("local_attendances");

  notify("students_updated");
  notify("materials_updated");
  notify("attendances_updated");
};
