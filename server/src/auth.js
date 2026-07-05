import { pbkdf2Sync, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { query } from "./db.js";

const COOKIE_NAME = "suzuki_session";
const HASH_ALGORITHM = "sha256";
const HASH_ITERATIONS = 210000;
const HASH_KEY_LENGTH = 32;
const SESSION_DAYS = 14;

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM).toString("hex");
  return `pbkdf2_${HASH_ALGORITHM}$${HASH_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [scheme, iterationsText, salt, expectedHex] = storedHash.split("$");
  if (scheme !== `pbkdf2_${HASH_ALGORITHM}` || !iterationsText || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = pbkdf2Sync(
    password,
    salt,
    Number(iterationsText),
    expected.length,
    HASH_ALGORITHM
  );

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hashToken(token) {
  const secret = process.env.SESSION_SECRET || "";
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

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

export function setSessionCookie(reply, token, expiresAt) {
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export function clearSessionCookie(reply) {
  reply.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function requireTeacher(request, reply) {
  const user = await getSessionUser(request);
  if (!user || user.role !== "teacher") {
    return reply.code(401).send({ error: "Authentication required" });
  }
  request.user = user;
}

export { COOKIE_NAME };
