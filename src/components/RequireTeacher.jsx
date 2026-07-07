import { useState, useEffect } from "react";
import { getCurrentUser, usesServerBackend } from "../api";
import Login from "../pages/Login";

// In server mode the teacher area is gated by a session cookie; in local
// (single-PC) mode there is no server to ask, so it renders directly.
export default function RequireTeacher({ children }) {
  const serverMode = usesServerBackend();
  const [status, setStatus] = useState(serverMode ? "loading" : "ok");

  useEffect(() => {
    if (!serverMode) return;
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (active) setStatus(user?.role === "teacher" ? "ok" : "login");
      })
      .catch(() => {
        if (active) setStatus("login");
      });
    return () => {
      active = false;
    };
  }, [serverMode]);

  if (status === "loading") {
    return <div className="text-on-surface-variant text-center mt-12 text-lg">Checking sign-in…</div>;
  }
  if (status === "login") {
    return <Login onSuccess={() => setStatus("ok")} />;
  }
  return children;
}
