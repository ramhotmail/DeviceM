import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await withAuth(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  const db = getDb();
  
  try {
    let result;
    if (q) {
      result = await db.execute({
        sql: `SELECT * FROM devices WHERE 
              device_name LIKE '%' || ? || '%' OR 
              device_code LIKE '%' || ? || '%' OR 
              serial_number LIKE '%' || ? || '%' 
              ORDER BY id DESC`,
        args: [q, q, q]
      });
    } else {
      result = await db.execute("SELECT * FROM devices ORDER BY id DESC");
    }
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch devices', error);
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await withAuth(request); // Any authenticated user
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const data = await request.json();
    const db = getDb();

    const result = await db.execute({
      sql: `INSERT INTO devices (
        org_name, system_name, device_name, device_code, location, 
        brand, model, serial_number, agent_company, maintenance_company, 
        maintenance_status, contract_start, contract_end, maintenance_officer, 
        maintenance_phone, image_base64
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.org_name || 'مستشفيات جامعة قناة السويس',
        data.system_name || 'نظام تكويد الأجهزة الطبية',
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
        data.image_base64 || null
      ]
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid?.toString() });
  } catch (error) {
    console.error('Failed to create device', error);
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
  }
}
