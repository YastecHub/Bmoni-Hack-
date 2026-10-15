import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbDir = path.dirname(config.databaseFile);
if (!fs.existsSync(dbDir)) {
	fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(config.databaseFile);

// Enable foreign keys and WAL mode for high performance
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize Schema
export function initDatabase() {
	const schemaPath = path.resolve(__dirname, 'schema.sql');
	const schemaSql = fs.readFileSync(schemaPath, 'utf8');
	db.exec(schemaSql);
}

// Database helper utilities
export const dbHelper = {
	all<T = any>(sql: string, params: any[] = []): T[] {
		const stmt = db.prepare(sql);
		return stmt.all(...params) as T[];
	},

	get<T = any>(sql: string, params: any[] = []): T | undefined {
		const stmt = db.prepare(sql);
		const result = stmt.get(...params);
		return result as T | undefined;
	},

	run(sql: string, params: any[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } {
		const stmt = db.prepare(sql);
		return stmt.run(...params);
	},

	transaction<T>(fn: () => T): T {
		db.exec('BEGIN TRANSACTION;');
		try {
			const result = fn();
			db.exec('COMMIT;');
			return result;
		} catch (error) {
			db.exec('ROLLBACK;');
			throw error;
		}
	}
};
