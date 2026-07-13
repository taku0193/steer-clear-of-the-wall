import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  DuplicateRankingSubmissionError,
  RankingDatabaseUnavailableError,
} from "./rankingErrors";
import type {
  RankingEntry,
  RankingSnapshot,
  RankingSubmission,
  RankingSubmissionResponse,
  StoredRankingEntry,
} from "./rankingTypes";

type RankingRow = {
  id: number;
  submission_id: string;
  display_name: string;
  score: number;
  successful_walls: number;
  speed_level: number;
  misses: number;
  created_at: string;
};

type RankingRepositoryOptions = {
  now?: () => Date;
};

export interface RankingRepository {
  insert(submission: RankingSubmission): RankingSubmissionResponse;
  getSnapshot(): RankingSnapshot;
  healthCheck(): boolean;
  close(): void;
}

const ORDER_BY = `
  score DESC,
  successful_walls DESC,
  misses ASC,
  created_at ASC,
  id ASC
`;

export function createRankingRepository(
  databasePath: string,
  options: RankingRepositoryOptions = {},
): RankingRepository {
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  const now = options.now ?? (() => new Date());

  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  migrate(database);

  const insertStatement = database.prepare(`
    INSERT INTO ranking_entries (
      submission_id, display_name, score, successful_walls,
      speed_level, misses, created_at
    ) VALUES (
      @submissionId, @displayName, @score, @successfulWalls,
      @speedLevel, @misses, @createdAt
    )
  `);
  const findBySubmissionStatement = database.prepare(`
    SELECT * FROM ranking_entries WHERE submission_id = ?
  `);
  const topStatement = database.prepare(`
    SELECT * FROM ranking_entries ORDER BY ${ORDER_BY} LIMIT 100
  `);
  const totalStatement = database.prepare(`SELECT COUNT(*) AS count FROM ranking_entries`);
  const rankStatement = database.prepare(`
    SELECT COUNT(*) AS count
    FROM ranking_entries
    WHERE
      score > @score OR
      (score = @score AND successful_walls > @successfulWalls) OR
      (score = @score AND successful_walls = @successfulWalls AND misses < @misses) OR
      (score = @score AND successful_walls = @successfulWalls AND misses = @misses AND created_at < @createdAt) OR
      (score = @score AND successful_walls = @successfulWalls AND misses = @misses AND created_at = @createdAt AND id < @databaseId)
  `);

  const insertTransaction = database.transaction(
    (submission: RankingSubmission): RankingSubmissionResponse => {
      const createdAt = now().toISOString();
      try {
        insertStatement.run({ ...submission, createdAt });
      } catch (error) {
        if (isUniqueConstraint(error)) {
          throw new DuplicateRankingSubmissionError(submission.submissionId);
        }
        throw error;
      }

      const row = findBySubmissionStatement.get(submission.submissionId) as
        | RankingRow
        | undefined;
      if (!row) throw new RankingDatabaseUnavailableError();
      const stored = mapStoredEntry(row);
      const rank = getRank(stored);
      return { entry: toPublicEntry(stored, rank), rank };
    },
  );

  function getRank(entry: StoredRankingEntry): number {
    const result = rankStatement.get(entry) as { count: number };
    return result.count + 1;
  }

  return {
    insert(submission) {
      return insertTransaction.immediate(submission);
    },

    getSnapshot() {
      const rows = topStatement.all() as RankingRow[];
      const total = totalStatement.get() as { count: number };
      return {
        entries: rows.map((row, index) => toPublicEntry(mapStoredEntry(row), index + 1)),
        totalEntries: total.count,
        updatedAt: now().toISOString(),
      };
    },

    healthCheck() {
      const result = database.prepare("SELECT 1 AS ok").get() as { ok: number };
      return result.ok === 1;
    },

    close() {
      if (database.open) database.close();
    },
  };
}

let sharedRepository: RankingRepository | null = null;

export function getRankingRepository(): RankingRepository {
  if (sharedRepository) return sharedRepository;
  const databasePath = getDatabasePath();
  try {
    sharedRepository = createRankingRepository(databasePath);
    return sharedRepository;
  } catch (error) {
    throw new RankingDatabaseUnavailableError({ cause: error });
  }
}

function getDatabasePath(): string {
  const configuredPath = process.env.RANKING_DATABASE_PATH;
  if (configuredPath) return resolve(configuredPath);
  if (process.env.NODE_ENV === "production") {
    throw new RankingDatabaseUnavailableError();
  }
  return resolve(process.cwd(), "data", "ranking.db");
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const version = database.prepare(
    "SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations",
  ).get() as { version: number };
  if (version.version >= 1) return;

  database.transaction(() => {
    database.exec(`
      CREATE TABLE ranking_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        score INTEGER NOT NULL CHECK(score >= 0 AND score <= 1000000),
        successful_walls INTEGER NOT NULL CHECK(successful_walls >= 0 AND successful_walls <= 10000),
        speed_level INTEGER NOT NULL CHECK(speed_level >= 1 AND speed_level <= 100),
        misses INTEGER NOT NULL CHECK(misses >= 0 AND misses <= 100),
        created_at TEXT NOT NULL
      );
      CREATE INDEX ranking_order_idx ON ranking_entries (
        score DESC,
        successful_walls DESC,
        misses ASC,
        created_at ASC,
        id ASC
      );
    `);
    database.prepare(
      "INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)",
    ).run(new Date().toISOString());
  }).immediate();
}

function mapStoredEntry(row: RankingRow): StoredRankingEntry {
  return {
    databaseId: row.id,
    submissionId: row.submission_id,
    displayName: row.display_name,
    score: row.score,
    successfulWalls: row.successful_walls,
    speedLevel: row.speed_level,
    misses: row.misses,
    createdAt: row.created_at,
  };
}

function toPublicEntry(entry: StoredRankingEntry, rank: number): RankingEntry {
  return {
    id: entry.submissionId,
    rank,
    displayName: entry.displayName,
    score: entry.score,
    successfulWalls: entry.successfulWalls,
    speedLevel: entry.speedLevel,
    achievedAt: entry.createdAt,
  };
}

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Error && "code" in error &&
    String((error as Error & { code: unknown }).code).startsWith("SQLITE_CONSTRAINT_UNIQUE");
}
