'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import AppHeader from '@/components/AppHeader';

function PrintCard({ device, origin }: { device: any; origin: string }) {
  const qrUrl = `${origin}/card/${device.id}`;
  const row = (label: string, value: any) => <div className="flex min-h-[0.34cm] items-center justify-between border-b border-slate-300 px-[0.04cm] text-[6.5px] leading-tight"><span className="ml-1 whitespace-nowrap font-bold text-slate-700">{label}:</span><span className="max-w-[3.6cm] overflow-hidden text-ellipsis whitespace-nowrap font-bold text-slate-950">{value || '—'}</span></div>;
  return <article className="device-print-card flex h-[13cm] w-[6cm] flex-col overflow-hidden border-2 border-blue-950 bg-white p-[0.18cm] text-slate-950">
    <header className="flex h-[1.05cm] items-center justify-between border-b-2 border-blue-900 pb-[0.08cm]"><div className="min-w-0 text-right"><h1 className="whitespace-nowrap text-[8px] font-black text-blue-950">مستشفيات جامعة قناة السويس</h1><p className="mt-[1px] whitespace-nowrap text-[6.5px] font-bold text-slate-700">نظام تكويد الأجهزة الطبية</p></div><img src="/logo.png" alt="الشعار" className="h-[0.85cm] w-[0.85cm] object-contain" /></header>
    <div className="mx-auto my-[0.12cm] flex h-[2.35cm] w-[3.2cm] items-center justify-center overflow-hidden border border-slate-300 bg-slate-50">{device.image_base64 ? <img src={`data:image/jpeg;base64,${device.image_base64}`} alt={device.device_name} className="h-full w-full object-contain" /> : <span className="text-[7px] text-slate-400">لا توجد صورة</span>}</div>
    <div className="flex-1 overflow-hidden">{row('اسم الجهاز', device.device_name)}{row('كود الجهاز', device.device_code)}{row('المكان', device.location)}{row('الماركة', device.brand)}{row('الموديل', device.model)}{row('الرقم المسلسل', device.serial_number)}{row('الوكيل', device.agent_company)}{row('شركة الصيانة', device.maintenance_company)}{row('حالة الصيانة', device.maintenance_status)}{row('بداية التعاقد', device.contract_start)}{row('نهاية التعاقد', device.contract_end)}{row('مسؤول الصيانة', device.maintenance_officer)}{row('هاتف الصيانة', device.maintenance_phone)}</div>
    <footer className="mt-[0.08cm] flex items-end justify-between"><div className="text-[6px] font-bold text-blue-950">امسح الكود لعرض الجهاز<br />أو الإبلاغ عن عطل</div><div className="border border-slate-300 bg-white p-[1px]"><QRCodeSVG value={qrUrl} size={48} /></div></footer>
  </article>;
}

export default function PrintCardsPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const ids = new URLSearchParams(window.location.search).get('ids')?.split(',').filter(id => /^\d+$/.test(id)) || [];
    if (!ids.length) { setError('لم يتم تحديد أجهزة للطباعة.'); setLoading(false); return; }
    Promise.all(ids.map(id => fetch(`/api/devices/${id}`).then(res => res.ok ? res.json() : null)))
      .then(items => setDevices(items.filter(Boolean)))
      .catch(() => setError('تعذر تحميل بيانات الكروت.'))
      .finally(() => setLoading(false));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return <main className="app-page print:bg-white print:p-0" dir="rtl">`n    <AppHeader title="طباعة كروت الأجهزة" subtitle="تجهيز الكروت المحددة للطباعة الملونة" />
    <div className="mx-auto mb-6 mt-6 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm print:hidden"><div><h1 className="text-xl font-bold">طباعة كروت الأجهزة المحددة</h1><p className="text-sm text-slate-500">عدد الكروت: {devices.length} — المقاس: 6 × 13 سم</p></div><div className="flex gap-2"><Link href="/" className="rounded-lg bg-slate-100 px-4 py-2 font-bold">العودة</Link><button onClick={() => window.print()} disabled={!devices.length} className="rounded-lg bg-blue-700 px-5 py-2 font-bold text-white disabled:opacity-50">طباعة بالألوان</button></div></div>
    {loading && <div className="p-12 text-center font-bold">جاري تجهيز الكروت...</div>}{error && <div className="p-12 text-center font-bold text-red-600">{error}</div>}
    <section className="print-cards-sheet mx-auto grid w-fit grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-[0.25cm]">{devices.map(device => <PrintCard key={device.id} device={device} origin={origin} />)}</section>
  </main>;
}