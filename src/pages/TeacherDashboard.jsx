import { useState, useEffect } from "react";
import { subscribeToStudents, subscribeToMaterials, addStudent, deleteStudent, updateStudentVideos, addMaterial, deleteMaterial, subscribeToAttendances, addAttendance, deleteAttendance, editAttendance } from "../api";
import { Play, Headphones, FileText, UserPlus, Plus, Book, Trash2, Calendar, ChevronLeft, Edit2, ChevronDown, ChevronRight, Share2, Users } from "lucide-react";
import { combinedPreTwinkleFiles, allCheckpointsFiles, allJoggersFiles, allBooksFiles, allSuzukiMp3OfficialFiles, formatMediaName } from "../mediaConfig";
import Avatar from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import useDialogs from "../components/ui/useDialogs";
import AttendanceModal from "../components/teacher/AttendanceModal";
import AssignmentModal from "../components/teacher/AssignmentModal";
import AddStudentModal from "../components/teacher/AddStudentModal";
import AddMaterialModal from "../components/teacher/AddMaterialModal";
import DatabaseCard from "../components/teacher/DatabaseCard";

const getAvailableFiles = (globMap, categoryLabel) => {
  return Object.keys(globMap).map((path) => {
    const parts = path.split('/');
    const folder = parts.length > 2 ? parts.slice(2, -1).join(' / ') : "";
    const extension = path.split('.').pop().toLowerCase();
    let fileType = 'video';
    if (extension === 'pdf') fileType = 'book';
    else if (['mp3', 'wav'].includes(extension)) fileType = 'audio';

    return {
      videoId: path, // Use path as unique id
      title: formatMediaName(path),
      category: categoryLabel,
      type: fileType,
      folder: folder
    };
  }).sort((a,b) => a.title.localeCompare(b.title, undefined, {numeric: true}));
};

const ASSIGNMENT_TABS = [
  { id: 'pretwinkle', label: "Pre-Twinkle", files: getAvailableFiles(combinedPreTwinkleFiles, "pretwinkle") },
  { id: 'checkpoints', label: "Checkpoints", files: getAvailableFiles(allCheckpointsFiles, "checkpoints") },
  { id: 'joggers', label: "Time Joggers", files: getAvailableFiles(allJoggersFiles, "timejoggers") },
  { id: 'suzukimp3', label: "Suzuki mp3", files: getAvailableFiles(allSuzukiMp3OfficialFiles, "suzukimp3") },
  { id: 'books', label: "Books", files: getAvailableFiles(allBooksFiles, "book") }
];

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attendances, setAttendances] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Track which attendance records are expanded
  const [expandedRecords, setExpandedRecords] = useState({});

  // Modal state: which modal is open and, for attendance, which record is edited
  const [attendanceModal, setAttendanceModal] = useState(null); // null | { editing: record | null }
  const [assignModalStudentId, setAssignModalStudentId] = useState(null);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [addMaterialModalOpen, setAddMaterialModalOpen] = useState(false);

  const { confirm, notice, dialogs } = useDialogs();

  const toggleRecord = (id) => {
    setExpandedRecords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setExpandedRecords({});
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedStudentId]);

  useEffect(() => {
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubMaterials = subscribeToMaterials(setMaterials);
    const unsubAttendances = subscribeToAttendances(setAttendances);

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubMaterials) unsubMaterials();
      if (unsubAttendances) unsubAttendances();
    };
  }, []);

  const handleAssignSelectedVideo = async (fileObj) => {
    const studentId = assignModalStudentId;
    setAssignModalStudentId(null); // close modal

    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;

    const assignedVideos = targetStudent.assignedVideos ? [...targetStudent.assignedVideos] : [];
    assignedVideos.push({ type: fileObj.category, title: fileObj.title, videoId: fileObj.videoId });

    await updateStudentVideos(studentId, assignedVideos);
  };

  const handleRemoveVideo = async (studentId, videoIndex) => {
    if (!(await confirm("Do you really want to remove this piece?", { title: "Remove material", confirmLabel: "Remove" }))) return;

    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;
    const assignedVideos = targetStudent.assignedVideos.filter((_, idx) => idx !== videoIndex);

    await updateStudentVideos(studentId, assignedVideos);
  };

  const handleSaveNewStudent = async (name) => {
    await addStudent(name);
    setAddStudentModalOpen(false);
  };

  const handleRemoveStudent = async (studentId, e) => {
    e.stopPropagation();
    if (!(await confirm("Do you really want to permanently delete this student?", { title: "Delete student", confirmLabel: "Delete" }))) return;
    await deleteStudent(studentId);
    if (selectedStudentId === studentId) setSelectedStudentId(null);
  };

  const handleSaveNewMaterial = async (materialData) => {
    await addMaterial(materialData);
    setAddMaterialModalOpen(false);
  };

  const handleRemoveMaterial = async (materialId) => {
    if (!(await confirm("Do you really want to delete this material?", { title: "Delete material", confirmLabel: "Delete" }))) return;
    await deleteMaterial(materialId);
  };

  const handleSaveAttendance = async (date, note) => {
    if (attendanceModal?.editing) {
      await editAttendance(attendanceModal.editing.id, date, note);
    } else {
      await addAttendance(selectedStudentId, date, note);
    }
    setAttendanceModal(null);
  };

  const handleRemoveAttendance = async (attendanceId) => {
    if (!(await confirm("Do you really want to delete this lesson record?", { title: "Delete lesson record", confirmLabel: "Delete" }))) return;
    await deleteAttendance(attendanceId);
  };

  const handleShareStudentLink = async () => {
    const targetStudent = students.find(s => s.id === selectedStudentId);
    if (!targetStudent) return;
    try {
      const shareData = {
        id: targetStudent.id,
        name: targetStudent.name,
        assignedVideos: targetStudent.assignedVideos || []
      };
      const bytes = new TextEncoder().encode(JSON.stringify(shareData));
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const base64Data = btoa(binary);
      const shareUrl = `${window.location.origin}/student/${targetStudent.id}?d=${encodeURIComponent(base64Data)}`;

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
      await notice(`Failed to copy link: ${e.message}`, { title: "Copy failed", danger: true });
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const studentAttendances = attendances
    .filter(a => a.studentId === selectedStudentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-6xl mx-auto py-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          {selectedStudentId && (
            <button
              onClick={() => setSelectedStudentId(null)}
              className="p-3 bg-surface-variant hover:bg-outline-variant/30 text-on-surface-variant rounded-full transition-colors shadow-sm"
              title="Back to list"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
            {selectedStudentId ? selectedStudent?.name : "Teacher Dashboard"}
          </h1>
        </div>

        {!selectedStudentId && (
          <button
            onClick={() => setAddStudentModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dim text-on-primary border-none rounded-full font-bold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">Add Student</span>
          </button>
        )}

        {selectedStudentId && (
          <div className="flex gap-2.5">
            <button
              onClick={handleShareStudentLink}
              className={`flex items-center gap-2 px-6 py-3 border rounded-full font-bold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 ${
                copied
                  ? "bg-secondary-container border-secondary-fixed-dim text-on-secondary-container"
                  : "bg-secondary-container border-outline-variant/30 text-on-secondary-container hover:bg-secondary-fixed-dim"
              }`}
            >
              <Share2 size={20} />
              <span>{copied ? "Kopírováno!" : "Sdílet odkaz"}</span>
            </button>
            <button
              onClick={() => setAttendanceModal({ editing: null })}
              className="flex items-center gap-2 px-6 py-3 bg-tertiary hover:bg-tertiary/90 text-on-tertiary border-none rounded-full font-bold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1"
            >
              <Calendar size={20} />
              <span>Log Lesson</span>
            </button>
          </div>
        )}
      </div>

      {selectedStudentId ? (
        /* --- STUDENT DETAIL VIEW --- */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEVÝ SLOUPEC: Záznamy z hodin (Docházka) */}
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-background mb-6">Past Lessons</h2>
            {studentAttendances.length > 0 ? (
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                {studentAttendances.map((record) => {
                  const displayDate = new Date(record.date).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  });
                  const isExpanded = !!expandedRecords[record.id];
                  return (
                    <div
                      key={record.id}
                      className="border-b border-outline-variant/20 last:border-b-0 hover:bg-surface-variant/10 transition-all p-3 flex flex-col"
                    >
                      <div
                        className="flex justify-between items-center cursor-pointer select-none"
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => toggleRecord(record.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleRecord(record.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-on-surface-variant transition-transform duration-200">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </span>
                          <span className="font-headline font-bold text-sm text-primary flex items-center gap-2">
                            <Calendar size={16} className="text-tertiary" />
                            {displayDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" role="presentation" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setAttendanceModal({ editing: record })}
                            className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveAttendance(record.id)}
                            className="p-2.5 text-on-surface-variant hover:text-error hover:bg-madder-wash rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-outline-variant/10 pt-2 mt-2 pl-7">
                          <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-line">
                            {record.note || <span className="italic opacity-70">No note</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No lesson records"
                hint="Click the Log Lesson button above to add one."
              />
            )}
          </div>

          {/* PRAVÝ SLOUPEC: Materiály a úkoly */}
          <div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-2xl font-bold text-on-background">Assigned Materials</h2>
                <button
                  onClick={() => setAssignModalStudentId(selectedStudentId)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container rounded-xl transition-colors shadow-sm font-bold text-sm"
                >
                  <Plus size={16} /> Add
                </button>
             </div>

             <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col gap-3">
                  {selectedStudent?.assignedVideos && selectedStudent.assignedVideos.length > 0 ? (
                    selectedStudent.assignedVideos.map((vid, idx) => (
                      <div key={`${vid.videoId}-${idx}`} className="bg-surface-container border border-outline-variant/50 p-3 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-primary/10 rounded-lg text-primary">
                             {vid.type === 'book' ? <FileText size={18} /> : vid.type === 'audio' ? <Headphones size={18} /> : <Play size={18} />}
                           </div>
                           <span className="font-medium text-on-background">{vid.title}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveVideo(selectedStudentId, idx)}
                          className="p-2.5 text-on-surface-variant hover:text-error hover:bg-madder-wash rounded-lg transition-colors"
                          title="Remove task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-on-surface-variant text-sm font-medium italic text-center block py-4">No materials assigned yet.</span>
                  )}
                </div>
             </div>
          </div>
        </div>
      ) : (
        /* --- MAIN DASHBOARD VIEW (List of all students & teacher materials) --- */
        <div className="flex flex-col gap-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column: Students List */}
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-background mb-6">My Students</h2>
              <div className="flex flex-col gap-4">
                {students.map(student => (
                  <div
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedStudentId(student.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedStudentId(student.id);
                      }
                    }}
                    className="group flex justify-between items-center p-4 sm:p-5 bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container hover:border-primary/40 shadow-sm hover:shadow-md rounded-2xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar name={student.name} className="w-12 h-12 text-lg" />
                      <div>
                        <h3 className="font-headline text-xl font-bold text-on-background group-hover:text-primary transition-colors">{student.name}</h3>
                        <span className="text-sm text-on-surface-variant">
                          {student.assignedVideos?.length || 0} materials
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveStudent(student.id, e)}
                      className="p-2.5 text-on-surface-variant/60 hover:text-error hover:bg-madder-wash rounded-full transition-colors"
                      title="Remove student"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {students.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title="No students here yet"
                    hint="Click Add Student above to create the first one."
                  />
                )}
              </div>
            </div>

            {/* Right Column: Teacher Materials */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-2xl font-bold text-on-background">My Materials</h2>
                <button
                  onClick={() => setAddMaterialModalOpen(true)}
                  className="p-2.5 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container rounded-xl transition-colors shadow-sm"
                  title="Add material"
                >
                  <Plus size={18} />
                </button>
              </div>

              {materials.length > 0 ? (
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col gap-0">
                  {materials.map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between py-4 border-b border-outline-variant/20 last:border-0 last:pb-0 first:pt-0">
                      <div className="flex items-center gap-4">
                        <Book size={28} className="text-tertiary hidden sm:block shrink-0" />
                        <div>
                          <h4 className="font-headline font-bold text-on-background m-0 text-lg">{mat.title}</h4>
                          <span className="text-on-surface-variant text-sm font-medium inline-block mt-1 uppercase tracking-wide">{mat.category}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMaterial(mat.id)}
                        className="p-2.5 bg-madder-wash hover:bg-madder-wash/70 text-error rounded-lg transition-colors shadow-sm shrink-0 ml-4"
                        title="Remove material"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Book}
                  title="No materials yet"
                  hint="Click + to add the first one."
                />
              )}
            </div>
          </div>

          {/* Database Management Card */}
          <DatabaseCard />
        </div>
      )}

      {attendanceModal && (
        <AttendanceModal
          editing={attendanceModal.editing}
          onSave={handleSaveAttendance}
          onClose={() => setAttendanceModal(null)}
        />
      )}

      {assignModalStudentId && (
        <AssignmentModal
          tabs={ASSIGNMENT_TABS}
          onAssign={handleAssignSelectedVideo}
          onClose={() => setAssignModalStudentId(null)}
        />
      )}

      {addStudentModalOpen && (
        <AddStudentModal
          onSave={handleSaveNewStudent}
          onClose={() => setAddStudentModalOpen(false)}
        />
      )}

      {addMaterialModalOpen && (
        <AddMaterialModal
          onSave={handleSaveNewMaterial}
          onClose={() => setAddMaterialModalOpen(false)}
        />
      )}

      {dialogs}
    </div>
  );
}
