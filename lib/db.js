// App singletons: SQLite database in ./data and the session secret.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createDatabase } from "./store";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

export const db = createDatabase(dataDir);

export function getSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const secretFile = path.join(dataDir, "secret.key");
  try {
    return fs.readFileSync(secretFile, "utf8").trim();
  } catch {
    const secret = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(secretFile, secret, { flag: "wx" });
    return secret;
  }
}
