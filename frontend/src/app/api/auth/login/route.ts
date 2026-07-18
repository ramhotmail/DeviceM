import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function verifyWerkzeug(password: string, hashStr: string): boolean {
  try {
    if (hashStr.startsWith('scrypt:')) {
      const parts = hashStr.split('$');
      if (parts.length !== 3) return false;
      const [header, salt, hash] = parts;
      const [algo, N, r, p] = header.split(':');
      const keyLen = hash.length / 2; // Hex string to byte length
      const derived = crypto.scryptSync(password, salt, keyLen, {
        N: parseInt(N),
        r: parseInt(r),
        p: parseInt(p),
        maxmem: 128 * 1024 * 1024
      });
      return derived.toString('hex') === hash;
    }
    if (hashStr.startsWith('pbkdf2:')) {
      const parts = hashStr.split('$');
      if (parts.length !== 3) return false;
      const [header, salt, hash] = parts;
      const [algo, hashFunc, iterations] = header.split(':');
      const keyLen = hash.length / 2;
      const derived = crypto.pbkdf2Sync(password, salt, parseInt(iterations), keyLen, hashFunc);
      return derived.toString('hex') === hash;
    }
    return false;
  } catch (err) {
    console.error('Werkzeug verify error:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    const db = getDb();
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username]
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0] as any;
    let isValid = false;
    let needsMigration = false;

    if (user.password_hash.startsWith('scrypt:') || user.password_hash.startsWith('pbkdf2:')) {
      isValid = verifyWerkzeug(password, user.password_hash);
      needsMigration = true;
    } else {
      isValid = await bcrypt.compare(password, user.password_hash);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Migrate to bcrypt seamlessly
    if (needsMigration) {
      const newHash = await bcrypt.hash(password, 10);
      await db.execute({
        sql: "UPDATE users SET password_hash = ? WHERE id = ?",
        args: [newHash, user.id]
      });
    }

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
