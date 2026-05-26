import { useState, useEffect } from "react";
import { subscribeToStudents, subscribeToMaterials, addStudent, deleteStudent, updateStudentVideos, addMaterial, deleteMaterial, subscribeToAttendances, addAttendance, deleteAttendance, editAttendance } from "../api";
import { Play, X, Headphones, FileText, UserPlus, Plus, Book, Trash2, Calendar, ChevronLeft, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { combinedPreTwinkleFiles, allCheckpointsFiles, allJoggersFiles, allBooksFiles, allSuzukiMp3OfficialFiles, formatMediaName } from "../mediaConfig";

const getAvailableFiles = (globMap, categoryLabel) => {
  return Object.entries(globMap).map(([path, url]) => {
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

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("teacherAuth") === "true";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attendances, setAttendances] = useState([]);
  
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  
  // Track which attendance records are expanded
  const [expandedRecords, setExpandedRecords] = useState({});

  const toggleRecord = (id) => {
    setExpandedRecords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    setExpandedRecords({});
  }, [selectedStudentId]);
  
  // Attendance modal states
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceNote, setAttendanceNote] = useState("");

  const [assignModalStudentId, setAssignModalStudentId] = useState(null);
  const [assignModalActiveTab, setAssignModalActiveTab] = useState('pretwinkle');

  // Add Student modal states
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");

  // Add Material modal states
  const [addMaterialModalOpen, setAddMaterialModalOpen] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialCategory, setNewMaterialCategory] = useState("PDF");
  
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubStudents = subscribeToStudents((data) => {
      setStudents(data);
    });
    const unsubMaterials = subscribeToMaterials((data) => {
      setMaterials(data);
    });
    const unsubAttendances = subscribeToAttendances((data) => {
      setAttendances(data);
    });
    
    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubMaterials) unsubMaterials();
      if (unsubAttendances) unsubAttendances();
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    const handleLogin = (e) => {
      e.preventDefault();
      if (passwordInput.toLowerCase() === "cello") {
        sessionStorage.setItem("teacherAuth", "true");
        setIsAuthenticated(true);
      } else {
        setAuthError(true);
      }
    };

    return (
      <div className="max-w-md mx-auto py-20 px-6">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-8 shadow-md text-center">
          <h2 className="font-headline text-2xl font-bold text-primary mb-6">Teacher Access</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
              placeholder="Enter password..." 
              className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary transition-colors text-center"
              autoFocus
            />
            {authError && <p className="text-red-500 text-sm font-medium">Incorrect password</p>}
            <button 
              type="submit" 
              className="px-6 py-3 bg-primary hover:bg-primary-dim text-on-primary rounded-xl font-bold transition-all shadow-sm"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const initiateAddVideo = (studentId) => {
    setAssignModalStudentId(studentId);
    setAssignModalActiveTab('pretwinkle');
  };

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
    if (!window.confirm("Do you really want to remove this piece?")) return;
    
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;
    const assignedVideos = targetStudent.assignedVideos.filter((_, idx) => idx !== videoIndex);

    await updateStudentVideos(studentId, assignedVideos);
  };

  const handleSaveNewStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    await addStudent(newStudentName.trim());
    setAddStudentModalOpen(false);
  };

  const handleRemoveStudent = async (studentId, e) => {
    e.stopPropagation();
    if (!window.confirm("Do you really want to permanently delete this student?")) return;
    await deleteStudent(studentId);
    if (selectedStudentId === studentId) setSelectedStudentId(null);
  };

  const handleSaveNewMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialTitle.trim()) return;
    const category = newMaterialCategory.trim() || "PDF";
    await addMaterial({ title: newMaterialTitle.trim(), category });
    setAddMaterialModalOpen(false);
  };

  const handleRemoveMaterial = async (materialId) => {
    if (!window.confirm("Do you really want to delete this material?")) return;
    await deleteMaterial(materialId);
  };

  // --- Attendance Handlers ---
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (editingAttendanceId) {
      await editAttendance(editingAttendanceId, attendanceDate, attendanceNote);
    } else {
      await addAttendance(selectedStudentId, attendanceDate, attendanceNote);
    }
    setAttendanceModalOpen(false);
  };

  const openAttendanceModal = (attendance = null) => {
    if (attendance) {
      setEditingAttendanceId(attendance.id);
      setAttendanceDate(attendance.date);
      setAttendanceNote(attendance.note);
    } else {
      setEditingAttendanceId(null);
      // Předvyplníme dnešní datum (YYYY-MM-DD) s lokálním časovým pásmem
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
      setAttendanceDate(localISOTime);
      setAttendanceNote("");
    }
    setAttendanceModalOpen(true);
  };

  const handleRemoveAttendance = async (attendanceId) => {
    if (!window.confirm("Do you really want to delete this lesson record?")) return;
    await deleteAttendance(attendanceId);
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
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary drop-shadow-sm">
            {selectedStudentId ? selectedStudent?.name : "Teacher Dashboard"}
          </h1>
        </div>
        
        {!selectedStudentId && (
          <button 
            onClick={() => { setAddStudentModalOpen(true); setNewStudentName(""); }}
            className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dim text-on-primary border-none rounded-xl font-bold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">Add Student</span>
          </button>
        )}
        
        {selectedStudentId && (
          <button 
            onClick={() => openAttendanceModal()}
            className="flex items-center gap-2 px-6 py-3 bg-tertiary hover:bg-tertiary/90 text-on-primary border-none rounded-xl font-bold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1"
          >
            <Calendar size={20} />
            <span>Log Lesson</span>
          </button>
        )}
      </div>

      {selectedStudentId ? (
        /* --- STUDENT DETAIL VIEW --- */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEVÝ SLOUPEC: Záznamy z hodin (Docházka) */}
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-background mb-6">Past Lessons</h2>
            <div className="flex flex-col gap-4">
              {studentAttendances.length > 0 ? (
                studentAttendances.map((record) => {
                  const displayDate = new Date(record.date).toLocaleDateString('cs-CZ', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  });
                  const isExpanded = !!expandedRecords[record.id];
                  return (
                    <div key={record.id} className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/30 rounded-2xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all">
                      <div 
                        className="flex justify-between items-center cursor-pointer select-none" 
                        onClick={() => toggleRecord(record.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-on-surface-variant transition-transform duration-200">
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </span>
                          <span className="font-headline font-bold text-base text-primary flex items-center gap-2">
                            <Calendar size={18} className="text-tertiary" />
                            {displayDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => openAttendanceModal(record)}
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleRemoveAttendance(record.id)}
                            className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-outline-variant/20 pt-3 mt-2">
                          <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-line">
                            {record.note || <span className="italic opacity-50">No note</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-10 bg-surface-container-low rounded-3xl border border-outline-variant/30 text-on-surface-variant shadow-sm">
                  <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-1">No lesson records</p>
                  <p className="text-sm">Click the Log Lesson button above to add one.</p>
                </div>
              )}
            </div>
          </div>

          {/* PRAVÝ SLOUPEC: Materiály a úkoly */}
          <div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-2xl font-bold text-on-background">Assigned Materials</h2>
                <button 
                  onClick={() => initiateAddVideo(selectedStudentId)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container rounded-lg transition-colors shadow-sm font-bold text-sm"
                >
                  <Plus size={16} /> Add
                </button>
             </div>
             
             <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col gap-3">
                  {selectedStudent?.assignedVideos && selectedStudent.assignedVideos.length > 0 ? (
                    selectedStudent.assignedVideos.map((vid, idx) => (
                      <div key={idx} className="bg-surface-container border border-outline-variant/50 p-3 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-primary/10 rounded-lg text-primary">
                             {vid.type === 'book' ? <FileText size={18} /> : vid.type === 'audio' ? <Headphones size={18} /> : <Play size={18} />}
                           </div>
                           <span className="font-medium text-on-background">{vid.title}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveVideo(selectedStudentId, idx)}
                          className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Students List */}
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-background mb-6">My Students</h2>
            <div className="flex flex-col gap-4">
              {students.map(student => (
                <div 
                  key={student.id} 
                  onClick={() => setSelectedStudentId(student.id)}
                  className="group flex justify-between items-center p-4 sm:p-5 bg-surface-container-lowest hover:bg-surface-container-low rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-variant text-on-surface-variant rounded-full flex items-center justify-center font-medium text-lg uppercase">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-medium text-on-background group-hover:text-primary transition-colors">{student.name}</h3>
                      <span className="text-sm text-on-surface-variant">
                        {student.assignedVideos?.length || 0} materials
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleRemoveStudent(student.id, e)}
                    className="p-2 text-on-surface-variant hover:text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove student"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {students.length === 0 && (
                <div className="text-on-surface-variant text-center p-8 bg-surface-container-low rounded-3xl border border-outline-variant/30">No students here yet...</div>
              )}
            </div>
          </div>

          {/* Right Column: Teacher Materials */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-2xl font-bold text-on-background">My Materials</h2>
               <button 
                 onClick={() => { setAddMaterialModalOpen(true); setNewMaterialTitle(""); setNewMaterialCategory("PDF"); }}
                 className="p-2 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container rounded-lg transition-colors shadow-sm"
                 title="Add material"
               >
                  <Plus size={18} />
                </button>
            </div>
            
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col gap-0">
              {materials.length > 0 ? (
                materials.map((mat) => (
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
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors shadow-sm shrink-0 ml-4"
                      title="Remove material"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4">
                   <span className="text-on-surface-variant text-sm font-medium">No materials yet. Click + to add.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAttendanceModalOpen(false)} />
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] w-full max-w-md max-h-[90vh] shadow-2xl z-10 overflow-hidden transform transition-all flex flex-col">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] w-full max-w-md max-h-[90vh] shadow-2xl z-10 overflow-hidden transform transition-all flex flex-col">
            <form onSubmit={handleSaveAttendance} className="flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-outline-variant/10 bg-surface-container shrink-0">
                <h2 className="font-headline text-xl font-medium text-on-background flex items-center gap-2">
                  <Calendar size={20} className="text-tertiary" />
                  {editingAttendanceId ? "Edit Lesson" : "Log Lesson"}
                </h2>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setAttendanceModalOpen(false)}
                    className="px-4 py-2 hover:bg-surface-variant text-on-surface-variant font-medium rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary hover:opacity-90 text-on-primary font-medium rounded-full transition-opacity"
                  >
                    Save
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 flex flex-col gap-6 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">Date</label>
                  <input 
                    type="date" 
                    required
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                    className="px-4 py-2 rounded-md border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">Note (what was played)</label>
                  <textarea 
                    required
                    rows="4"
                    value={attendanceNote}
                    onChange={e => setAttendanceNote(e.target.value)}
                    placeholder="E.g. C major scale, repeating Minuet..."
                    className="px-4 py-3 rounded-md border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none w-full"
                  ></textarea>
                  
                  {/* Quick Entry Buttons */}
                  <div className="mt-2 flex flex-col gap-4">
                    <div>
                      <span className="text-sm font-medium text-on-surface-variant mb-2 block">Základy</span>
                      <div className="flex flex-wrap gap-2">
                        {["C Scale", "D Scale", "G Scale", "A Scale", "Ševčík", "Time Joggers", "Rick Mooney"].map(item => (
                          <button 
                            key={item} 
                            type="button" 
                            onClick={() => setAttendanceNote(prev => prev ? prev + ", " + item : item)} 
                            className="px-3 py-1.5 bg-surface-variant text-on-surface-variant text-sm font-medium rounded-lg hover:bg-primary hover:text-on-primary transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-on-surface-variant mb-2 block">Suzuki Book 1</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Twinkle Var.", "French Folk Song", "Lightly Row", "Song of the Wind", "Go Tell Aunt Rhody", "O Come, Little Children", "May Song", "Allegro", "Perpetual Motion", "Long, Long Ago", "Allegretto", "Andantino", "Rigadoon", "Etude", "The Happy Farmer", "Minuet in C", "Minuet No. 2"].map(piece => (
                          <button 
                            key={piece} 
                            type="button" 
                            onClick={() => setAttendanceNote(prev => prev ? prev + ", " + piece : piece)} 
                            className="px-2.5 py-1 bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs font-medium rounded-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm"
                          >
                            {piece}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-on-surface-variant mb-2 block">Suzuki Book 2</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Long, Long Ago (Bk2)", "May Time", "Minuet No. 1", "Minuet No. 3", "Judas Maccabaeus", "Hunters' Chorus", "Musette", "March in G", "Witches' Dance", "Two Grenadiers", "Gavotte (Gossec)", "Bourrée (Handel)"].map(piece => (
                          <button 
                            key={piece} 
                            type="button" 
                            onClick={() => setAttendanceNote(prev => prev ? prev + ", " + piece : piece)} 
                            className="px-2.5 py-1 bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs font-medium rounded-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm"
                          >
                            {piece}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {assignModalStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAssignModalStudentId(null)} />
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl z-10 overflow-hidden transform transition-all">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container shrink-0">
              <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-background">Assign exercise / material</h2>
              <button onClick={() => setAssignModalStudentId(null)} className="p-2 hover:bg-surface-variant text-on-surface-variant rounded-full transition-colors shadow-sm">
                <X size={24} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex overflow-x-auto p-4 gap-2 bg-surface-container-low shrink-0 border-b border-outline-variant/10">
              {ASSIGNMENT_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAssignModalActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 ${
                    assignModalActiveTab === tab.id 
                      ? "bg-primary text-on-primary shadow-md"
                      : "bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content / File List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ASSIGNMENT_TABS.find(t => t.id === assignModalActiveTab)?.files.map(file => (
                   <div 
                     key={file.videoId} 
                     onClick={() => handleAssignSelectedVideo(file)}
                     className="group cursor-pointer bg-surface-container-low hover:bg-primary-container/20 border border-outline-variant/30 hover:border-primary/40 rounded-2xl p-4 flex items-center gap-3 transition-colors shadow-sm hover:shadow-md"
                   >
                     <div className="shrink-0 text-tertiary">
                       {file.type === 'book' ? <FileText size={24} /> : file.type === 'audio' ? <Headphones size={24} /> : <Play size={24} />}
                     </div>
                     <div className="min-w-0 flex-1">
                       <h4 className="font-headline text-sm font-bold text-on-background group-hover:text-primary transition-colors leading-snug break-words">
                         {file.title}
                       </h4>
                       {file.folder && <span className="text-xs text-on-surface-variant font-medium block mt-1 truncate">{file.folder}</span>}
                     </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {addStudentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddStudentModalOpen(false)} />
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] w-full max-w-md shadow-2xl z-10 overflow-hidden transform transition-all flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container">
              <h2 className="font-headline text-2xl font-bold text-on-background flex items-center gap-2">
                <UserPlus size={24} className="text-tertiary" />
                Add Student
              </h2>
              <button onClick={() => setAddStudentModalOpen(false)} className="p-2 hover:bg-surface-variant text-on-surface-variant rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveNewStudent} className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Student Name</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="Enter new student's name..."
                  className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setAddStudentModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-surface-variant hover:bg-outline-variant/30 text-on-surface-variant font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dim text-on-primary font-bold rounded-xl transition-colors shadow-sm"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MATERIAL MODAL */}
      {addMaterialModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddMaterialModalOpen(false)} />
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] w-full max-w-md shadow-2xl z-10 overflow-hidden transform transition-all flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 bg-surface-container">
              <h2 className="font-headline text-2xl font-bold text-on-background flex items-center gap-2">
                <Book size={24} className="text-tertiary" />
                Add Material
              </h2>
              <button onClick={() => setAddMaterialModalOpen(false)} className="p-2 hover:bg-surface-variant text-on-surface-variant rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveNewMaterial} className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Material Name</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={newMaterialTitle}
                  onChange={e => setNewMaterialTitle(e.target.value)}
                  placeholder="E.g. C major scale..."
                  className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Category</label>
                <input 
                  type="text" 
                  value={newMaterialCategory}
                  onChange={e => setNewMaterialCategory(e.target.value)}
                  placeholder="E.g. PDF, Link, Video..."
                  className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors w-full"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setAddMaterialModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-surface-variant hover:bg-outline-variant/30 text-on-surface-variant font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dim text-on-primary font-bold rounded-xl transition-colors shadow-sm"
                >
                  Přidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
