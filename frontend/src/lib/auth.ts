import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

export async function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function withAuth(req: Request, requireAdmin = false) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  const decoded: any = await verifyToken(token);
  if (!decoded) {
    return { error: 'Invalid token', status: 401 };
  }

  if (requireAdmin && decoded.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  return { user: decoded };
}
