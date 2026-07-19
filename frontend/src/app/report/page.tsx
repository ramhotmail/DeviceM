'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';

type Device = Record<string, any>;

const columns: Array<[string, string]> = [
  ['device_code', 'كود الجهاز'], ['device_name', 'اسم الجهاز'], ['location', 'القسم / المكان'],
  ['brand', 'الماركة'], ['model', 'الموديل'], ['serial_number', 'الرقم المسلسل'],
  ['agent_company', 'الشركة الوكيل'], ['maintenance_company', 'شركة الصيانة'],
  ['maintenance_status', 'حالة الصيانة'], ['contract_start', 'بداية التعاقد / الضمان'],
  ['contract_end', 'نهاية التعاقد / الضمان'], ['maintenance_officer', 'مسؤول الصيانة'],
  ['maintenance_phone', 'هاتف مسؤول الصيانة'], ['created_at', 'تاريخ الإضافة']
];

function downloadFile(content: BlobPart, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export default function Report() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/devices');
        if (res.status === 401) return router.push('/login');
        if (!res.ok) throw new Error();
        setDevices(await res.json());
      } catch { setError('تعذر تحميل تقرير الأجهزة.'); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const filtered = useMemo(() => devices.filter(device => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [device.device_code, device.device_name, device.location, device.brand, device.model, device.serial_number].some(value => String(value || '').toLowerCase().includes(term));
    const created = String(device.created_at || '').slice(0, 10);
    const matchesFrom = !fromDate || (created && created >= fromDate);
    const matchesTo = !toDate || (created && created <= toDate);
    const matchesStatus = !status || device.maintenance_status === status;
    return matchesSearch && matchesFrom && matchesTo && matchesStatus;
  }), [devices, search, fromDate, toDate, status]);

  const statuses = useMemo(() => Array.from(new Set(devices.map(d => d.maintenance_status).filter(Boolean))).sort(), [devices]);
  const today = new Date().toISOString().slice(0, 10);

  const exportCsv = () => {
    const rows = [columns.map(([, label]) => csvCell(label)).join(','), ...filtered.map(device => columns.map(([key]) => csvCell(device[key])).join(','))];
    downloadFile(`\uFEFF${rows.join('\r\n')}`, 'text/csv;charset=utf-8', `devices-report-${today}.csv`);
  };

  const exportBackup = () => {
    const backup = { exported_at: new Date().toISOString(), total: devices.length, devices };
    downloadFile(JSON.stringify(backup, null, 2), 'application/json;charset=utf-8', `devices-backup-${today}.json`);
  };

  const clearFilters = () => { setSearch(''); setFromDate(''); setToDate(''); setStatus(''); };

  return (
    <main className="app-page print:bg-white" dir="rtl"><AppHeader title="تقرير الأجهزة" subtitle="التقارير والتصدير والنسخ الاحتياطي" />
      <div className="mx-auto max-w-[1500px] p-4 sm:p-8 print:p-0">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 print:block">
          <div><h1 className="text-2xl font-bold text-slate-900">تقرير جميع الأجهزة</h1><p className="mt-1 text-sm text-slate-500 print:text-center">قائمة الأجهزة المسجلة مع خيارات الحفظ والنسخ الاحتياطي.</p></div>
          <Link href="/" className="rounded-lg bg-white px-4 py-2 font-bold text-blue-700 shadow-sm hover:bg-blue-50 print:hidden">العودة للرئيسية</Link>
        </header>

        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

        <section className="mb-6 grid gap-4 sm:grid-cols-3 print:hidden">
          <div className="rounded-xl bg-blue-700 p-5 text-white shadow-sm"><div className="text-sm text-blue-100">إجمالي الأجهزة</div><div className="mt-2 text-3xl font-bold">{devices.length}</div></div>
          <div className="rounded-xl bg-emerald-600 p-5 text-white shadow-sm"><div className="text-sm text-emerald-100">نتائج التقرير الحالية</div><div className="mt-2 text-3xl font-bold">{filtered.length}</div></div>
          <div className="rounded-xl bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">آخر تحديث للتقرير</div><div className="mt-2 font-bold text-slate-800">{new Date().toLocaleString('ar-EG')}</div></div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm print:hidden">
          <div className="grid gap-4 md:grid-cols-5 md:items-end">
            <label className="md:col-span-2"><span className="mb-1 block text-sm font-bold">بحث</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="الاسم، الكود، المكان، الماركة، السيريال..." className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500" /></label>
            <label><span className="mb-1 block text-sm font-bold">من تاريخ</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5" /></label>
            <label><span className="mb-1 block text-sm font-bold">إلى تاريخ</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5" /></label>
            <label><span className="mb-1 block text-sm font-bold">حالة الصيانة</span><select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5"><option value="">كل الحالات</option>{statuses.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={exportCsv} disabled={!filtered.length} className="rounded-lg bg-green-600 px-4 py-2.5 font-bold text-white hover:bg-green-700 disabled:opacity-50">تصدير Excel / CSV</button>
            <button onClick={exportBackup} disabled={!devices.length} className="rounded-lg bg-indigo-600 px-4 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:opacity-50">تنزيل نسخة احتياطية JSON</button>
            <button onClick={() => window.print()} disabled={!filtered.length} className="rounded-lg bg-slate-800 px-4 py-2.5 font-bold text-white hover:bg-slate-900 disabled:opacity-50">طباعة / حفظ PDF</button>
            <button onClick={clearFilters} className="rounded-lg bg-slate-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-200">مسح الفلاتر</button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm print:shadow-none">
          <div className="hidden border-b p-3 text-center print:block"><h2 className="text-xl font-bold">تقرير الأجهزة الطبية</h2><p className="text-sm">إجمالي النتائج: {filtered.length} — تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p></div>
          {loading ? <div className="p-12 text-center font-bold text-slate-500">جاري تحميل الأجهزة...</div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[1150px] border-collapse text-right text-sm print:min-w-0 print:text-[9px]">
              <thead className="bg-slate-200 text-slate-700"><tr><th className="border p-3 print:p-1">م</th>{columns.map(([, label]) => <th key={label} className="border p-3 print:p-1">{label}</th>)}</tr></thead>
              <tbody>{filtered.map((device, index) => <tr key={device.id} className="hover:bg-slate-50"><td className="border p-3 font-bold print:p-1">{index + 1}</td>{columns.map(([key]) => <td key={key} className="max-w-[180px] border p-3 print:p-1">{device[key] || '—'}</td>)}</tr>)}</tbody>
            </table></div>
          )}
          {!loading && !filtered.length && <div className="p-10 text-center text-slate-500">لا توجد أجهزة مطابقة للفلاتر الحالية.</div>}
          <div className="border-t bg-slate-50 p-4 text-left text-lg font-bold text-blue-800">إجمالي النتائج: {filtered.length}</div>
        </section>
      </div>
    </main>
  );
}