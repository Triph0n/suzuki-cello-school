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
  const passwordHash = hashPassword(password);
  await query(
    `INSERT INTO users (email, display_name, password_hash, role)
     VALUES ($1, $2, $3, 'teacher')
     ON CONFLICT (email) DO UPDATE
     SET display_name = excluded.display_name,
         password_hash = excluded.password_hash,
         role = 'teacher',
         updated_at = now()`,
    [email, displayName, passwordHash]
  );
  console.log(`Teacher admin ready: ${email}`);
} finally {
  await closePool();
}
