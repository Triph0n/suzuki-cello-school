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
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-center text-primary mb-12 drop-shadow-sm">
        Who is practicing today?
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {students.map((student) => (
          <Link 
            key={student.id} 
            to={`/student/${student.id}`}
            className="group block"
          >
            <div className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/50 shadow-md hover:shadow-xl rounded-[2.5rem] p-8 flex flex-col items-center gap-6 transition-all duration-500 transform group-hover:-translate-y-2">
              <div className="bg-secondary-container text-on-secondary-container rounded-full p-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <User size={48} />
              </div>
              <h2 className="font-headline text-2xl font-bold text-on-background group-hover:text-primary transition-colors">
                {student.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
