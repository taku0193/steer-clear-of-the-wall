import Database from "better-sqlite3";
import { mkdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const sourcePath = process.env.RANKING_DATABASE_PATH;
const backupDirectory = process.env.RANKING_BACKUP_DIR;

if (!sourcePath || !backupDirectory) {
  console.error("RANKING_DATABASE_PATH and RANKING_BACKUP_DIR are required.");
  process.exitCode = 1;
} else {
  const source = resolve(sourcePath);
  const targetDirectory = resolve(backupDirectory);
  await mkdir(targetDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = join(targetDirectory, `${basename(source, ".db")}-${timestamp}.db`);
  const database = new Database(source, { readonly: true, fileMustExist: true });
  try {
    await database.backup(target);
    console.log(target);
  } finally {
    database.close();
  }
}
