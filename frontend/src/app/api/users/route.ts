import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const auth = await withAuth(request, true); // require admin
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = getDb();
  
  try {
    const result = await db.execute("SELECT id, username, role, created_at FROM users ORDER BY id");
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await withAuth(request, true); // require admin
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { username, password, role } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if user exists
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [username]
    });
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'viewer';

    await db.execute({
      sql: "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      args: [username, hash, userRole]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
