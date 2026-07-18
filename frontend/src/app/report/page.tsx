'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Report() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app we'd add an API endpoint for reports with date filters, 
      // but for simplicity we can fetch all and filter on client side, 
      // or modify the /api/devices route. For now let's just fetch all and filter.
      const res = await fetch('/api/devices');
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((d: any) => {
          if (!d.created_at) return false;
          const date = d.created_at.split(' ')[0]; // Basic string comparison
          return date >= fromDate && date <= toDate;
        });
        setDevices(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">تقرير الأجهزة المضافة</h1>
          <Link href="/" className="text-blue-600 hover:underline font-bold">العودة للرئيسية</Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">من تاريخ</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} required className="w-full border p-3 rounded outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">إلى تاريخ</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} required className="w-full border p-3 rounded outline-none focus:border-blue-500" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded font-bold hover:bg-blue-700 transition">
              {loading ? 'جاري البحث...' : 'بحث وتوليد التقرير'}
            </button>
            <button type="button" onClick={() => window.print()} className="bg-gray-800 text-white px-8 py-3 rounded font-bold hover:bg-gray-900 transition ml-2">
              طباعة
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6 print:shadow-none print:p-0">
          <h2 className="text-xl font-bold mb-4 print:block hidden text-center">تقرير الأجهزة من {fromDate} إلى {toDate}</h2>
          <table className="w-full text-right border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200 text-gray-700 print:bg-gray-100">
                <th className="p-3 border border-gray-300">م</th>
                <th className="p-3 border border-gray-300">الكود</th>
                <th className="p-3 border border-gray-300">اسم الجهاز</th>
                <th className="p-3 border border-gray-300">القسم</th>
                <th className="p-3 border border-gray-300">الماركة</th>
                <th className="p-3 border border-gray-300">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, i) => (
                <tr key={d.id} className="border border-gray-300">
                  <td className="p-3 border border-gray-300">{i + 1}</td>
                  <td className="p-3 border border-gray-300 font-semibold">{d.device_code}</td>
                  <td className="p-3 border border-gray-300">{d.device_name}</td>
                  <td className="p-3 border border-gray-300">{d.location}</td>
                  <td className="p-3 border border-gray-300">{d.brand}</td>
                  <td className="p-3 border border-gray-300" dir="ltr">{d.created_at}</td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">لا توجد بيانات</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 text-left font-bold text-lg text-blue-800">
            إجمالي الأجهزة: {devices.length}
          </div>
        </div>
      </div>
    </div>
  );
}
