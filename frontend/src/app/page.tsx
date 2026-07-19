'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchDevices();
    fetch('/api/auth/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user || null));
  }, []);

  const fetchDevices = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/devices?q=${encodeURIComponent(q)}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDevices(search);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleDelete = async (device: any) => {
    const label = device.device_name || 'الجهاز';
    const code = device.device_code ? ` (${device.device_code})` : '';
    if (!window.confirm(`هل تريد حذف ${label}${code} نهائيًا؟\nلا يمكن التراجع عن الحذف.`)) return;

    setDeletingId(device.id);
    try {
      const res = await fetch(`/api/devices/${device.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDevices(current => current.filter(item => item.id !== device.id));
      } else if (res.status === 403) {
        alert('الحذف متاح لمدير النظام فقط.');
      } else {
        alert('تعذر حذف الجهاز. حاول مرة أخرى.');
      }
    } catch {
      alert('تعذر الاتصال بالخادم.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleDevice = (id: number) => {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const toggleAll = () => {
    setSelectedIds(current => current.length === devices.length ? [] : devices.map(device => device.id));
  };

  const printSelected = () => {
    if (!selectedIds.length) return alert('اختر جهازًا واحدًا على الأقل للطباعة.');
    window.open(`/print-cards?ids=${selectedIds.join(',')}`, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center">
        <div className="text-xl font-bold">لوحة التحكم - الأجهزة الطبية</div>
        <div className="flex gap-4">
          <Link href="/maintenance" className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded font-semibold transition">
            بلاغات الصيانة
          </Link>
          <Link href="/report" className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-semibold transition">
            تقرير الأجهزة
          </Link>
          {currentUser?.role === 'admin' && (
            <Link href="/users" className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded font-semibold transition">
              إدارة المستخدمين
            </Link>
          )}
          {['admin', 'editor'].includes(currentUser?.role) && (
            <Link href="/add" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition">
              إضافة جهاز جديد +
            </Link>
          )}
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition">
            تسجيل خروج
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input 
              type="text" 
              placeholder="ابحث باسم الجهاز، الكود، أو السيريال..." 
              className="flex-1 border border-gray-300 p-3 rounded outline-none focus:border-blue-500 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold transition">
              بحث
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <div className="text-sm font-bold text-slate-600">تم تحديد {selectedIds.length} من {devices.length} جهاز</div>
            <div className="flex gap-2">
              <button type="button" onClick={toggleAll} disabled={!devices.length} className="rounded-lg bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50">{selectedIds.length === devices.length && devices.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</button>
              <button type="button" onClick={printSelected} disabled={!selectedIds.length} className="rounded-lg bg-purple-700 px-5 py-2 font-bold text-white hover:bg-purple-800 disabled:opacity-50">طباعة الكروت المحددة</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-10 font-bold text-gray-500">جاري التحميل...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="w-14 p-4 border-b text-center"><input type="checkbox" aria-label="تحديد كل الأجهزة" checked={devices.length > 0 && selectedIds.length === devices.length} onChange={toggleAll} className="h-5 w-5 accent-purple-700" /></th>
                  <th className="p-4 border-b">الكود</th>
                  <th className="p-4 border-b">اسم الجهاز</th>
                  <th className="p-4 border-b">القسم</th>
                  <th className="p-4 border-b">الماركة</th>
                  <th className="p-4 border-b">حالة الصيانة</th>
                  <th className="p-4 border-b text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id} className={`border-b last:border-0 transition ${selectedIds.includes(d.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-4 text-center"><input type="checkbox" aria-label={`تحديد ${d.device_name || 'الجهاز'}`} checked={selectedIds.includes(d.id)} onChange={() => toggleDevice(d.id)} className="h-5 w-5 accent-purple-700" /></td>
                    <td className="p-4 font-semibold text-blue-600">{d.device_code}</td>
                    <td className="p-4">{d.device_name}</td>
                    <td className="p-4">{d.location}</td>
                    <td className="p-4">{d.brand}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        d.maintenance_status === 'عقد صيانة' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {d.maintenance_status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      <Link href={`/card/${d.id}`} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition">
                        عرض الكارت
                      </Link>
                      {['admin', 'editor'].includes(currentUser?.role) && (<>
                        <Link href={`/edit/${d.id}`} className="rounded bg-amber-500 px-3 py-1 text-sm font-bold text-white transition hover:bg-amber-600">
                          تعديل
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(d)}
                          disabled={deletingId === d.id}
                          className="rounded bg-red-600 px-3 py-1 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:bg-red-300"
                        >
                          {deletingId === d.id ? 'جاري الحذف...' : 'حذف'}
                        </button>
                      </>)}
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">لا توجد أجهزة مطابقة للبحث</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
