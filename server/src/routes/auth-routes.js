import { COOKIE_NAME, clearSessionCookie, createSession, destroySession, getSessionUser, setSessionCookie, verifyAgainstDummy, verifyPassword } from "../auth.js";
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
  app.post("/api/auth/login", {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: "Too many login attempts. Try again in a minute."
        })
      }
    },
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", minLength: 3, maxLength: 320 },
          password: { type: "string", minLength: 1, maxLength: 1024 }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    const result = await query(
      "SELECT id, email, display_name, role, password_hash FROM users WHERE lower(email) = lower($1)",
      [String(email).trim()]
    );
    const user = result.rows[0];

    const passwordOk = user
      ? await verifyPassword(String(password), user.password_hash)
      : await verifyAgainstDummy(String(password));

    if (!user || !passwordOk) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const session = await createSession(user.id);
    setSessionCookie(reply, session.token, session.expiresAt);
    return { user: publicUser(user) };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await destroySession(request.cookies?.[COOKIE_NAME]);
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/auth/me", async (request) => {
    const user = await getSessionUser(request);
    return { user: publicUser(user) };
  });
}
