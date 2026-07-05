import "dotenv/config";
import { buildApp } from "../src/server.js";

process.env.DATABASE_URL ||= "postgres://check:check@localhost:5432/check";
process.env.SESSION_SECRET ||= "check-secret";
process.env.NODE_ENV = "test";

const app = await buildApp();
await app.close();
console.log("Backend imports OK");
