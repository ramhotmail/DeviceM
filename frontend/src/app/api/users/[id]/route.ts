import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, context: any) {
  const auth = await withAuth(request, true);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;

  try {
    const { username, role, password } = await request.json();
    const cleanUsername = String(username || '').trim();
    const allowedRoles = ['admin', 'editor', 'viewer'];

    if (!cleanUsername || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }
    if (password && String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (auth.user?.id.toString() === id && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 });
    }

    const db = getDb();
    const user = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [id] });
    if (user.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const duplicate = await db.execute({ sql: 'SELECT id FROM users WHERE username = ? AND id != ?', args: [cleanUsername, id] });
    if (duplicate.rows.length > 0) return NextResponse.json({ error: 'Username already exists' }, { status: 409 });

    if (password) {
      const hash = await bcrypt.hash(String(password), 10);
      await db.execute({ sql: 'UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?', args: [cleanUsername, role, hash, id] });
    } else {
      await db.execute({ sql: 'UPDATE users SET username = ?, role = ? WHERE id = ?', args: [cleanUsername, role, id] });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const auth = await withAuth(request, true);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  if (auth.user?.id.toString() === id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });

  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}