import { clearSessionCookie, createSession, destroySession, getSessionUser, setSessionCookie, verifyPassword } from "../auth.js";
import { query } from "../db.js";

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role
  };
}

export async function registerAuthRoutes(app) {
  app.post("/api/auth/login", async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password are required" });
    }

    const result = await query(
      "SELECT id, email, display_name, role, password_hash FROM users WHERE lower(email) = lower($1)",
      [String(email).trim()]
    );
    const user = result.rows[0];

    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const session = await createSession(user.id);
    setSessionCookie(reply, session.token, session.expiresAt);
    return { user: publicUser(user) };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await destroySession(request.cookies?.suzuki_session);
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/auth/me", async (request) => {
    const user = await getSessionUser(request);
    return { user: publicUser(user) };
  });
}
