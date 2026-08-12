import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { subscribeToStudents, getStudents, importStudent } from "../api";
import StudentHomeView from "../components/StudentHomeView";

export default function StudentDashboard() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    // Check for encoded student data in the URL
    const searchParams = new URLSearchParams(window.location.search);
    const dParam = searchParams.get('d');
    if (dParam) {
      try {
        const bytes = Uint8Array.from(atob(dParam), (c) => c.charCodeAt(0));
        const decoded = new TextDecoder().decode(bytes);
        const imported = JSON.parse(decoded);
        if (imported && imported.id === id) {
          importStudent(imported);
          // Clean up URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (e) {
        console.error("Failed to parse shared student data:", e);
      }
    }

    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        setStudent(getStudents().find(s => s.id === id));
        setLoading(false);
      }
    }, 1500);

    try {
      unsubscribe = subscribeToStudents((data) => {
        if (isMounted) {
          clearTimeout(fallbackTimeout);
          const found = data.find(s => s.id === id) || getStudents().find(s => s.id === id);
          setStudent(found);
          setLoading(false);
        }
      });
    } catch {
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            clearTimeout(fallbackTimeout);
            setStudent(getStudents().find(s => s.id === id));
            setLoading(false);
          }
        }, 0);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  if (loading) return <div className="text-on-surface-variant text-center mt-12 text-lg">Loading...</div>;
  if (!student) return <div className="text-on-surface-variant text-center mt-12 text-lg">Student not found.</div>;

  return <StudentHomeView student={student} />;
}
