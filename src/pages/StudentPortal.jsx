import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchStudentPortal, usesServerBackend } from "../api";
import StudentHomeView from "../components/StudentHomeView";

// Private student/parent view opened from a teacher-generated /portal/<token>
// link. The token scopes the API response to a single student, so nothing
// else is reachable from here.
export default function StudentPortal() {
  const { token } = useParams();
  const serverMode = usesServerBackend();
  const [state, setState] = useState({ status: serverMode ? "loading" : "unsupported" });

  useEffect(() => {
    if (!serverMode) return;

    let active = true;
    fetchStudentPortal(token)
      .then((data) => {
        if (active) setState({ status: "ok", data });
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: error.message });
      });

    return () => {
      active = false;
    };
  }, [serverMode, token]);

  if (state.status === "loading") {
    return <div className="text-on-surface-variant text-center mt-12 text-lg">Loading...</div>;
  }
  if (state.status === "unsupported") {
    return (
      <div className="text-on-surface-variant text-center mt-12 text-lg">
        Private links are only available on the online portal.
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="text-on-surface-variant text-center mt-12 text-lg">
        {state.message || "This link is no longer valid."}
      </div>
    );
  }

  return <StudentHomeView student={state.data.student} lessonNotes={state.data.lessonNotes} />;
}
