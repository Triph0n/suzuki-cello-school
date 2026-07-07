import { useState } from "react";
import { Music } from "lucide-react";
import { login } from "../api";

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user?.role !== "teacher") {
        setError("This account does not have teacher access.");
        return;
      }
      onSuccess(user);
    } catch (err) {
      setError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl shadow-sm p-8">
        <div className="flex items-center gap-3 mb-2">
          <Music size={28} className="text-tertiary" />
          <h1 className="font-headline text-3xl font-bold text-primary">Teacher sign-in</h1>
        </div>
        <p className="text-on-surface-variant mb-8">
          Sign in to manage students, materials, and lesson records.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-sm font-medium text-on-surface-variant">Email</label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="text-sm font-medium text-on-surface-variant">Password</label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {error && (
            <p className="text-error bg-madder-wash rounded-xl px-4 py-3 text-sm font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-dim disabled:opacity-60 text-on-primary font-bold py-3 px-6 rounded-full transition-colors mt-2"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
