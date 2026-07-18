import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function DELETE(request: Request, context: any) {
  const { params } = context;
  const auth = await withAuth(request, true); // require admin
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  
  // Prevent deleting oneself
  if (auth.user?.id.toString() === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const db = getDb();

  try {
    await db.execute({
      sql: "DELETE FROM users WHERE id = ?",
      args: [id]
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
