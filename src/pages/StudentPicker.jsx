import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { subscribeToStudents } from "../api";

const AVATAR_TONES = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-lake-wash text-lake",
  "bg-rosin-wash text-rosin",
  "bg-madder-wash text-madder",
];

const avatarTone = (name = "") => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

export default function StudentPicker() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    try {
      unsubscribe = subscribeToStudents((data) => {
        if (isMounted) {
          setStudents(data);
          setLoading(false);
        }
      });
    } catch (e) {
      console.warn("Error subscribing to students", e);
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            setStudents([]);
            setLoading(false);
          }
        }, 0);
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) return <div className="text-on-surface-variant text-center mt-12 text-lg">Loading students...</div>;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
        {students.map((student) => (
          <Link 
            key={student.id} 
            to={`/student/${student.id}`}
            className="group block min-w-0"
          >
            <div className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 shadow-sm hover:shadow-md rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-3 transition-all duration-300 transform group-hover:-translate-y-1">
              <div className={`${avatarTone(student.name)} rounded-full w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center font-headline font-bold text-base sm:text-lg group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                {initials(student.name)}
              </div>
              <h2 className="font-headline text-xs sm:text-sm md:text-base font-bold text-on-background group-hover:text-primary transition-colors text-center truncate w-full">
                {student.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
