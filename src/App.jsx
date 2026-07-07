import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { Music, CheckSquare, Settings, Users, Menu, X, Book, LogOut } from "lucide-react";
import RequireTeacher from "./components/RequireTeacher";
import ErrorBoundary from "./components/ErrorBoundary";
import { logout, usesServerBackend } from "./api";

// Route-level code splitting: the student picker is all a pupil needs at
// start; the teacher dashboard, libraries and the Web Audio tuner load on
// demand (they also pull in the large media manifest).
const StudentPicker = lazy(() => import("./pages/StudentPicker"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const VideoLibrary = lazy(() => import("./pages/VideoLibrary"));
const TunerMetronome = lazy(() => import("./components/TunerMetronome"));

const PageLoading = () => (
  <div className="text-on-surface-variant text-center mt-12 text-lg">Loading...</div>
);

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn("Logout request failed", error);
    }
    navigate("/");
  };

  const isTeacherMode = location.pathname.startsWith('/teacher') ||
                        location.pathname.startsWith('/books') ||
                        location.pathname.startsWith('/pre-twinkle') ||
                        location.pathname.startsWith('/checkpoints') ||
                        location.pathname.startsWith('/time-joggers') ||
                        location.pathname.startsWith('/suzuki-mp3');

  // Close sidebar on route change mapping
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSidebarOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-background text-on-background font-body">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex justify-between items-center p-4 bg-surface-container-low shadow-sm z-50 sticky top-0">
        <h1 className="font-headline text-xl font-bold text-primary">
          Suzuki Cello
        </h1>
        <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-scrim/50 backdrop-blur-sm z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`fixed md:sticky top-0 left-0 h-dvh w-72 bg-surface-container-low/80 backdrop-blur-md border-r border-outline-variant/30 flex flex-col p-6 z-50 transition-transform duration-300 md:translate-x-0 overflow-y-auto ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-headline text-2xl font-bold text-primary flex items-center gap-2">
            <Music size={28} className="text-tertiary" />
            Suzuki Cello
          </h1>
          {/* Close button for mobile inside sidebar */}
          <button
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <NavLink to="/" icon={<Users size={20} />} label="Students" />
          {isTeacherMode && (
            <>
              <NavLink to="/books" icon={<Book size={20} />} label="Books (Library)" />
              <NavLink to="/pre-twinkle" icon={<Music size={20} />} label="Pre-Twinkle" />
              <NavLink to="/checkpoints" icon={<CheckSquare size={20} />} label="Checkpoints" />
              <NavLink to="/time-joggers" icon={<Music size={20} />} label="Cello time joggers" />
              <NavLink to="/suzuki-mp3" icon={<Music size={20} />} label="Suzuki mp3 Official" />
            </>
          )}
        </div>

        <div className="mt-auto">
          <Suspense fallback={null}>
            <TunerMetronome />
          </Suspense>
        </div>

        <div className="mt-8 pt-4 border-t border-outline-variant/30">
          <NavLink to="/teacher" icon={<Settings size={20} />} label="Teacher Mode" />
          {isTeacherMode && usesServerBackend() && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-on-surface-variant hover:text-error hover:bg-madder-wash transition-all duration-200 group"
            >
              <div className="text-tertiary group-hover:text-error transition-colors">
                <LogOut size={20} />
              </div>
              <span className="font-medium">Sign out</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-x-hidden relative max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

const NavLink = ({ to, icon, label }) => {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 px-4 py-3 rounded-2xl text-on-surface-variant hover:text-on-secondary-container hover:bg-secondary-container transition-all duration-200 group"
    >
      <div className="text-tertiary group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<StudentPicker />} />
            <Route path="/student/:id" element={<StudentDashboard />} />
            <Route path="/teacher" element={<RequireTeacher><TeacherDashboard /></RequireTeacher>} />
            <Route path="/books" element={<VideoLibrary title="Books Library" category="books" />} />
            <Route path="/pre-twinkle" element={<VideoLibrary title="Pre-Twinkle" category="pretwinkle" />} />
            <Route path="/checkpoints" element={<VideoLibrary title="Cello Checkpoints" category="checkpoints" />} />
            <Route path="/time-joggers" element={<VideoLibrary title="Cello time joggers" category="joggers" />} />
            <Route path="/suzuki-mp3" element={<VideoLibrary title="Suzuki mp3 Official" category="suzukimp3" />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
