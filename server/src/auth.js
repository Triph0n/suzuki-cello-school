import { pbkdf2, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";
import { query } from "./db.js";

const pbkdf2Async = promisify(pbkdf2);

const COOKIE_NAME = "suzuki_session";
const HASH_ALGORITHM = "sha256";
const HASH_ITERATIONS = 600000;
const HASH_KEY_LENGTH = 32;
const SESSION_DAYS = 14;

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET is required in production");
    }
    return "dev-only-session-secret";
  }
  return secret;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await pbkdf2Async(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM)).toString("hex");
  return `pbkdf2_${HASH_ALGORITHM}$${HASH_ITERATIONS}$${salt}$${hash}`;
}

// Verified against a real hash so unknown-email logins take the same time
// as wrong-password logins (no user-enumeration timing oracle).
const DUMMY_HASH_PROMISE = hashPassword("dummy-password-for-timing");

export async function verifyPassword(password, storedHash) {
  const [scheme, iterationsText, salt, expectedHex] = storedHash.split("$");
  if (scheme !== `pbkdf2_${HASH_ALGORITHM}` || !iterationsText || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = await pbkdf2Async(
    password,
    salt,
    Number(iterationsText),
    expected.length,
    HASH_ALGORITHM
  );

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function verifyAgainstDummy(password) {
  await verifyPassword(password, await DUMMY_HASH_PROMISE);
  return false;
}

export function hashToken(token) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  // Opportunistic cleanup so the sessions table cannot grow forever.
  await query("DELETE FROM sessions WHERE expires_at < now()");

  await query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt]
  );

  return { token, expiresAt };
}

export async function destroySession(token) {
  if (!token) return;
  await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
}

export async function getSessionUser(request) {
  const token = request.cookies?.[COOKIE_NAME];
  if (!token) return null;

  const result = await query(
    `SELECT users.id, users.email, users.display_name, users.role
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > now()`,
    [hashToken(token)]
  );

  return result.rows[0] || null;
}

const cookieAttributes = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/"
});

export function setSessionCookie(reply, token, expiresAt) {
  reply.setCookie(COOKIE_NAME, token, { ...cookieAttributes(), expires: expiresAt });
}

export function clearSessionCookie(reply) {
  reply.clearCookie(COOKIE_NAME, cookieAttributes());
}

export async function requireTeacher(request, reply) {
  const user = await getSessionUser(request);
  if (!user) {
    return reply.code(401).send({ error: "Authentication required" });
  }
  if (user.role !== "teacher") {
    return reply.code(403).send({ error: "Teacher access required" });
  }
  request.user = user;
}

export { COOKIE_NAME };
