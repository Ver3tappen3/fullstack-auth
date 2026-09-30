import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "db.json");

const defaultDb = {
  users: [],
  refreshTokens: []
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
      dbPath,
      JSON.stringify(defaultDb, null, 2),
      "utf8"
    );
  }
}

export function readDb() {
  ensureDb();

  return JSON.parse(
    fs.readFileSync(dbPath, "utf8")
  );
}

export function writeDb(db) {
  ensureDb();

  fs.writeFileSync(
    dbPath,
    JSON.stringify(db, null, 2),
    "utf8"
  );
}