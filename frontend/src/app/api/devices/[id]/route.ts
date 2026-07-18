import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(_request: Request, context: any) {
  const { params } = context;
  const { id } = await params;
  const db = getDb();

  try {
    const result = await db.execute({
      sql: "SELECT * FROM devices WHERE id = ?",
      args: [id]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch device' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  const { params } = context;
  const auth = await withAuth(request); // any authenticated user
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const data = await request.json();
  const db = getDb();

  try {
    await db.execute({
      sql: `UPDATE devices SET 
        org_name=?, system_name=?, device_name=?, device_code=?, location=?, 
        brand=?, model=?, serial_number=?, agent_company=?, maintenance_company=?, 
        maintenance_status=?, contract_start=?, contract_end=?, maintenance_officer=?, 
        maintenance_phone=?, image_base64=? 
        WHERE id=?`,
      args: [
        data.org_name || null,
        data.system_name || null,
        data.device_name || null,
        data.device_code || null,
        data.location || null,
        data.brand || null,
        data.model || null,
        data.serial_number || null,
        data.agent_company || null,
        data.maintenance_company || null,
        data.maintenance_status || null,
        data.contract_start || null,
        data.contract_end || null,
        data.maintenance_officer || null,
        data.maintenance_phone || null,
        data.image_base64 || null,
        id
      ]
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const { params } = context;
  const auth = await withAuth(request); // any authenticated user
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const db = getDb();

  try {
    await db.execute({
      sql: "DELETE FROM devices WHERE id = ?",
      args: [id]
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
  }
}
