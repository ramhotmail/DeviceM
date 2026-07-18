'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Report = Record<string, any>;
const statusLabel: Record<string, string> = { new: 'جديد', in_progress: 'جارٍ العمل', completed: 'مكتمل' };
const statusStyle: Record<string, string> = { new: 'bg-red-100 text-red-700', in_progress: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700' };

export default function MaintenanceReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [role, setRole] = useState('viewer');
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [reportsRes, meRes] = await Promise.all([fetch('/api/maintenance-reports'), fetch('/api/auth/me')]);
      if (reportsRes.status === 401) return router.push('/login');
      if (!reportsRes.ok) throw new Error();
      setReports(await reportsRes.json());
      if (meRes.ok) setRole((await meRes.json()).user?.role || 'viewer');
    } catch { setError('تعذر تحميل بلاغات الصيانة.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => reports.filter(report => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [report.device_name, report.device_code, report.location, report.fault_text, report.reporter_name].some(value => String(value || '').toLowerCase().includes(term));
    return (!filter || report.status === filter) && matchesSearch;
  }), [reports, filter, search]);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    const res = await fetch(`/api/maintenance-reports/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) setReports(current => current.map(item => item.id === id ? { ...item, status } : item));
    else setError('تعذر تحديث حالة البلاغ.');
    setUpdating(null);
  };

  const deleteReport = async (report: Report) => {
    if (!confirm(`هل تريد حذف البلاغ رقم ${report.id}؟`)) return;
    const res = await fetch(`/api/maintenance-reports/${report.id}`, { method: 'DELETE' });
    if (res.ok) setReports(current => current.filter(item => item.id !== report.id));
    else setError('تعذر حذف البلاغ.');
  };

  const counts = (status: string) => reports.filter(report => report.status === status).length;
  const canUpdate = ['admin', 'editor'].includes(role);

  return <main className="min-h-screen bg-slate-100 p-4 sm:p-8" dir="rtl"><div className="mx-auto max-w-7xl">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900">متابعة بلاغات الصيانة</h1><p className="mt-1 text-sm text-slate-500">جميع البلاغات المحفوظة من صفحات QR.</p></div><Link href="/" className="rounded-lg bg-white px-4 py-2 font-bold text-blue-700 shadow-sm">العودة للرئيسية</Link></header>
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
    <section className="mb-6 grid gap-4 sm:grid-cols-4"><button onClick={() => setFilter('')} className="rounded-xl bg-blue-700 p-5 text-right text-white"><span className="text-sm text-blue-100">كل البلاغات</span><strong className="mt-2 block text-3xl">{reports.length}</strong></button><button onClick={() => setFilter('new')} className="rounded-xl bg-red-600 p-5 text-right text-white"><span className="text-sm text-red-100">بلاغات جديدة</span><strong className="mt-2 block text-3xl">{counts('new')}</strong></button><button onClick={() => setFilter('in_progress')} className="rounded-xl bg-amber-500 p-5 text-right text-white"><span className="text-sm text-amber-50">جارٍ العمل</span><strong className="mt-2 block text-3xl">{counts('in_progress')}</strong></button><button onClick={() => setFilter('completed')} className="rounded-xl bg-green-600 p-5 text-right text-white"><span className="text-sm text-green-100">مكتملة</span><strong className="mt-2 block text-3xl">{counts('completed')}</strong></button></section>
    <section className="mb-5 rounded-xl bg-white p-4 shadow-sm"><div className="flex flex-wrap gap-3"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالجهاز أو الكود أو العطل أو المبلغ..." className="min-w-[260px] flex-1 rounded-lg border p-3" /><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border p-3"><option value="">كل الحالات</option><option value="new">جديد</option><option value="in_progress">جارٍ العمل</option><option value="completed">مكتمل</option></select><button onClick={load} className="rounded-lg bg-slate-800 px-5 py-3 font-bold text-white">تحديث</button></div></section>
    {loading ? <div className="p-12 text-center font-bold text-slate-500">جاري تحميل البلاغات...</div> : <section className="grid gap-4">{visible.map(report => <article key={report.id} className="rounded-xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[report.status]}`}>{statusLabel[report.status]}</span><span className="text-xs text-slate-400">بلاغ #{report.id}</span></div><h2 className="mt-3 text-lg font-bold text-slate-900">{report.device_name || 'جهاز محذوف'} <span className="text-sm text-blue-700">{report.device_code ? `(${report.device_code})` : ''}</span></h2><p className="mt-1 text-sm text-slate-500">{report.location || 'المكان غير مسجل'} · المبلغ: {report.reporter_name || 'غير مذكور'}</p></div><div className="text-left text-xs text-slate-500">{new Date(report.created_at).toLocaleString('ar-EG')}</div></div><div className="my-4 rounded-lg bg-slate-50 p-4 leading-7 text-slate-800">{report.fault_text}</div><div className="flex flex-wrap items-center gap-2"><Link href={`/card/${report.device_id}`} className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700">عرض الجهاز</Link>{canUpdate && <><button disabled={updating === report.id} onClick={() => updateStatus(report.id, 'new')} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700">جديد</button><button disabled={updating === report.id} onClick={() => updateStatus(report.id, 'in_progress')} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-700">بدء العمل</button><button disabled={updating === report.id} onClick={() => updateStatus(report.id, 'completed')} className="rounded-lg bg-green-100 px-3 py-2 text-sm font-bold text-green-700">تم الإصلاح</button></>}{role === 'admin' && <button onClick={() => deleteReport(report)} className="mr-auto rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">حذف البلاغ</button>}</div></article>)}{!visible.length && <div className="rounded-xl bg-white p-12 text-center text-slate-500">لا توجد بلاغات مطابقة.</div>}</section>}
  </div></main>;
}