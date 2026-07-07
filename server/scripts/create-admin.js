import "dotenv/config";
import { hashPassword } from "../src/auth.js";
import { closePool, query } from "../src/db.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_NAME || "Teacher";

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  process.exit(1);
}

try {
  const passwordHash = await hashPassword(password);
  // Do not overwrite the password of an existing account — re-running the
  // deploy script with a stale ADMIN_PASSWORD must not revert a manually
  // changed password. Use FORCE_ADMIN_PASSWORD=1 to reset it explicitly.
  const force = process.env.FORCE_ADMIN_PASSWORD === "1";
  const result = await query(
    `INSERT INTO users (email, display_name, password_hash, role)
     VALUES ($1, $2, $3, 'teacher')
     ON CONFLICT (email) DO UPDATE
     SET password_hash = CASE WHEN $4 THEN excluded.password_hash ELSE users.password_hash END,
         role = 'teacher',
         updated_at = now()
     RETURNING (xmax = 0) AS inserted`,
    [email, displayName, passwordHash, force]
  );
  const inserted = result.rows[0]?.inserted;
  console.log(
    inserted
      ? `Teacher admin created: ${email}`
      : `Teacher admin already exists: ${email}${force ? " (password reset)" : " (password unchanged)"}`
  );
} finally {
  await closePool();
}
