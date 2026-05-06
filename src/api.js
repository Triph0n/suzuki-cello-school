// -- STUDENTS API (Local Storage) --

export const getStudents = () => {
  const students = localStorage.getItem('local_students');
  return students ? JSON.parse(students) : [];
};

const saveStudents = (students) => {
  localStorage.setItem('local_students', JSON.stringify(students));
  window.dispatchEvent(new Event('students_updated'));
};

// Listen to all students (real-time substitute)
export const subscribeToStudents = (callback) => {
  callback(getStudents());
  const handler = () => callback(getStudents());
  window.addEventListener('students_updated', handler);
  return () => window.removeEventListener('students_updated', handler);
};

// Add a new student
export const addStudent = async (name) => {
  const students = getStudents();
  students.push({ id: Date.now().toString(), name, assignedVideos: [] });
  saveStudents(students);
};

// Delete a student
export const deleteStudent = async (studentId) => {
  const students = getStudents().filter(s => s.id !== studentId);
  saveStudents(students);
};

// Edit a student (UPDATE operation)
export const editStudent = async (studentId, newName) => {
  const students = getStudents().map(s => s.id === studentId ? { ...s, name: newName } : s);
  saveStudents(students);
};

// Assign/Remove a video to a student
export const updateStudentVideos = async (studentId, assignedVideos) => {
  const students = getStudents().map(s => s.id === studentId ? { ...s, assignedVideos } : s);
  saveStudents(students);
};

// -- TEACHER MATERIALS API (Local Storage) --

export const getMaterials = () => {
  const materials = localStorage.getItem('local_materials');
  return materials ? JSON.parse(materials) : [];
};

const saveMaterials = (materials) => {
  localStorage.setItem('local_materials', JSON.stringify(materials));
  window.dispatchEvent(new Event('materials_updated'));
};

export const subscribeToMaterials = (callback) => {
  callback(getMaterials());
  const handler = () => callback(getMaterials());
  window.addEventListener('materials_updated', handler);
  return () => window.removeEventListener('materials_updated', handler);
};

export const addMaterial = async (materialData) => {
  const materials = getMaterials();
  materials.push({ id: Date.now().toString(), ...materialData });
  saveMaterials(materials);
};

export const deleteMaterial = async (materialId) => {
  const materials = getMaterials().filter(m => m.id !== materialId);
  saveMaterials(materials);
};

// -- ATTENDANCE API (Local Storage) --

export const getAttendances = () => {
  const attendances = localStorage.getItem('local_attendances');
  return attendances ? JSON.parse(attendances) : [];
};

const saveAttendances = (attendances) => {
  localStorage.setItem('local_attendances', JSON.stringify(attendances));
  window.dispatchEvent(new Event('attendances_updated'));
};

export const subscribeToAttendances = (callback) => {
  callback(getAttendances());
  const handler = () => callback(getAttendances());
  window.addEventListener('attendances_updated', handler);
  return () => window.removeEventListener('attendances_updated', handler);
};

// Přidání záznamu z hodiny
export const addAttendance = async (studentId, date, note) => {
  const attendances = getAttendances();
  attendances.push({
    id: Date.now().toString(),
    studentId,
    date, // YYYY-MM-DD
    note
  });
  saveAttendances(attendances);
};

// Smazání záznamu z hodiny
export const deleteAttendance = async (attendanceId) => {
  const attendances = getAttendances().filter(a => a.id !== attendanceId);
  saveAttendances(attendances);
};

// Editace záznamu z hodiny
export const editAttendance = async (attendanceId, newDate, newNote) => {
  const attendances = getAttendances().map(a => 
    a.id === attendanceId ? { ...a, date: newDate, note: newNote } : a
  );
  saveAttendances(attendances);
};
