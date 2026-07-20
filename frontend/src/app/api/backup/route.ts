import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

const deviceFields = [
  'id', 'org_name', 'system_name', 'device_name', 'device_code', 'location',
  'brand', 'model', 'serial_number', 'agent_company', 'maintenance_company',
  'maintenance_status', 'contract_start', 'contract_end', 'maintenance_officer',
  'maintenance_phone', 'image_filename', 'image_base64', 'created_at'
] as const;
const reportFields = ['id', 'device_id', 'fault_text', 'reporter_name', 'status', 'created_at', 'updated_at'] as const;

function values(record: Record<string, unknown>, fields: readonly string[]) {
  return fields.map(field => record[field] ?? null);
}

export async function GET(request: Request) {
  const auth = await withAuth(request, true);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    await initDb();
    const db = getDb();
    const [devices, reports] = await Promise.all([
      db.execute('SELECT * FROM devices ORDER BY id'),
      db.execute('SELECT * FROM maintenance_reports ORDER BY id')
    ]);
    return NextResponse.json({
      format: 'medical-devices-backup',
      version: 1,
      exported_at: new Date().toISOString(),
      includes_images: true,
      devices: devices.rows,
      maintenance_reports: reports.rows
    });
  } catch (error) {
    console.error('Failed to create backup', error);
    return NextResponse.json({ error: 'تعذر إنشاء النسخة الاحتياطية.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await withAuth(request, true);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const backup = await request.json();
    if (backup?.format !== 'medical-devices-backup' || backup?.version !== 1 || !Array.isArray(backup.devices)) {
      return NextResponse.json({ error: 'ملف النسخة الاحتياطية غير صالح أو غير مدعوم.' }, { status: 400 });
    }
    const reports = Array.isArray(backup.maintenance_reports) ? backup.maintenance_reports : [];
    if (backup.devices.length > 10000 || reports.length > 50000) {
      return NextResponse.json({ error: 'حجم النسخة الاحتياطية أكبر من الحد المسموح.' }, { status: 400 });
    }
    await initDb();
    const db = getDb();
    const statements: any[] = ['DELETE FROM maintenance_reports', 'DELETE FROM devices'];
    for (const device of backup.devices) {
      statements.push({
        sql: `INSERT INTO devices (${deviceFields.join(', ')}) VALUES (${deviceFields.map(() => '?').join(', ')})`,
        args: values(device, deviceFields)
      });
    }
    for (const report of reports) {
      statements.push({
        sql: `INSERT INTO maintenance_reports (${reportFields.join(', ')}) VALUES (${reportFields.map(() => '?').join(', ')})`,
        args: values(report, reportFields)
      });
    }
    await db.batch(statements, 'write');
    return NextResponse.json({ success: true, devices: backup.devices.length, maintenance_reports: reports.length });
  } catch (error) {
    console.error('Failed to restore backup', error);
    return NextResponse.json({ error: 'تعذرت استعادة النسخة الاحتياطية. لم تكتمل العملية.' }, { status: 500 });
  }
}
