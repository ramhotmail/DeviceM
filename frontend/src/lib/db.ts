import { createClient, Client } from '@libsql/client';
import path from 'path';

let client: Client | null = null;

export function getDb() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'database.db')}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  client = createClient({
    url,
    authToken,
  });

  return client;
}

export async function initDb() {
  const db = getDb();
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        org_name TEXT,
        system_name TEXT,
        device_name TEXT,
        device_code TEXT,
        location TEXT,
        brand TEXT,
        model TEXT,
        serial_number TEXT,
        agent_company TEXT,
        maintenance_company TEXT,
        maintenance_status TEXT,
        contract_start TEXT,
        contract_end TEXT,
        maintenance_officer TEXT,
        maintenance_phone TEXT,
        image_filename TEXT,
        image_base64 TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default admin if no users exist
  const res = await db.execute("SELECT COUNT(*) as count FROM users");
  const count = res.rows[0].count as number;
  
  if (count === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    await db.execute({
      sql: "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      args: ["admin", hash, "admin"]
    });
  }
}
