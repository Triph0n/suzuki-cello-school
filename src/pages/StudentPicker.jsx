import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { subscribeToStudents } from "../api";
import { User } from "lucide-react";

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
        setStudents([]);
        setLoading(false);
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
              <div className="bg-secondary-container text-on-secondary-container rounded-full p-2.5 sm:p-3 group-hover:scale-105 transition-transform duration-300 shadow-inner shrink-0">
                <User size={20} className="sm:w-6 sm:h-6" />
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
