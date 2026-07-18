import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await withAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await initDb();
    const db = getDb();
    const result = await db.execute(`
      SELECT r.*, d.device_name, d.device_code, d.location,
             d.maintenance_officer, d.maintenance_phone
      FROM maintenance_reports r
      LEFT JOIN devices d ON d.id = r.device_id
      ORDER BY CASE r.status WHEN 'new' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END, r.id DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch maintenance reports', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { deviceId, faultText, reporterName } = await request.json();
    const cleanFault = String(faultText || '').trim();
    if (!deviceId || !cleanFault || cleanFault.length > 1000) {
      return NextResponse.json({ error: 'Invalid report data' }, { status: 400 });
    }

    await initDb();
    const db = getDb();
    const device = await db.execute({ sql: 'SELECT id FROM devices WHERE id = ?', args: [deviceId] });
    if (device.rows.length === 0) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

    const result = await db.execute({
      sql: `INSERT INTO maintenance_reports (device_id, fault_text, reporter_name, status)
            VALUES (?, ?, ?, 'new')`,
      args: [deviceId, cleanFault, String(reporterName || '').trim() || null]
    });
    return NextResponse.json({ success: true, id: result.lastInsertRowid?.toString() });
  } catch (error) {
    console.error('Failed to create maintenance report', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}