import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function PUT(request: Request, context: any) {
  const auth = await withAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!['admin', 'editor'].includes(auth.user?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const { status } = await request.json();
  if (!['new', 'in_progress', 'completed'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  try {
    const db = getDb();
    await db.execute({ sql: 'UPDATE maintenance_reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', args: [status, id] });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const auth = await withAuth(request, true);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  try {
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM maintenance_reports WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}