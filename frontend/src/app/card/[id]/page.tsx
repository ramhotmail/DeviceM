'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import AppHeader from '@/components/AppHeader';

function whatsappNumber(value: string) {
  let phone = (value || '').replace(/\D/g, '');
  if (phone.startsWith('00')) phone = phone.slice(2);
  if (phone.startsWith('0') && phone.length === 11) phone = `20${phone.slice(1)}`;
  return phone;
}

export default function CardPage() {
  const { id } = useParams();
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fault, setFault] = useState('');
  const [reporter, setReporter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDevice() {
      try {
        const res = await fetch(`/api/devices/${id}`);
        if (res.ok) setDevice(await res.json());
      } catch (fetchError) {
        console.error('Failed to fetch device', fetchError);
      } finally {
        setLoading(false);
      }
    }
    fetchDevice();
  }, [id]);

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل بيانات الجهاز...</div>;
  if (!device) return <div className="p-10 text-center font-bold text-red-600">لم يتم العثور على الجهاز.</div>;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${origin}/card/${id}`;
  const phone = whatsappNumber(device.maintenance_phone || '');

  const sendReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!fault.trim()) return setError('برجاء كتابة وصف العطل.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/maintenance-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: id, faultText: fault.trim(), reporterName: reporter.trim() })
      });
      if (!response.ok) throw new Error();

      setSuccess('تم حفظ البلاغ في شاشة المتابعة بنجاح.');
      const lines = [
        'بلاغ عطل جهاز طبي',
        `الجهاز: ${device.device_name || '-'}`,
        `كود الجهاز: ${device.device_code || '-'}`,
        `المكان: ${device.location || '-'}`,
        `العطل: ${fault.trim()}`,
        reporter.trim() ? `اسم المبلغ: ${reporter.trim()}` : '',
        `رابط الجهاز: ${qrUrl}`
      ].filter(Boolean);
      setFault(''); setReporter('');

      if (phone) window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
    } catch {
      setError('تعذر حفظ البلاغ. برجاء المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRow = (label: string, value: string | null) => (
    <div className="flex items-center justify-between border-b border-gray-300 py-1 text-[10px] print:min-h-[0.34cm] print:py-0 print:text-[6.5px] print:leading-tight">
      <div className="ml-2 whitespace-nowrap font-bold text-gray-800">{label} :</div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-bold text-gray-900">{value || '-'}</div>
    </div>
  );

  return (
    <main className="app-page print:bg-white print:p-0" dir="rtl">`n      <AppHeader title="كارت الجهاز" subtitle="بيانات الجهاز والإبلاغ عن الأعطال" />
      <div className="mx-auto grid max-w-4xl items-start gap-6 p-4 sm:p-8 md:grid-cols-[350px_1fr] print:block print:p-0">
        <section className="device-print-card relative mx-auto w-[350px] border-2 border-blue-950 bg-white p-4 shadow-xl print:m-0 print:h-[13cm] print:w-[6cm] print:overflow-hidden print:border-2 print:p-[0.18cm] print:shadow-none">
          <div className="mb-2 flex items-center justify-between border-b-2 border-gray-800 pb-1">
            <div className="text-right">
              <h1 className="whitespace-nowrap text-sm font-extrabold leading-tight text-blue-950 print:text-[8px]">مستشفيات جامعة قناة السويس</h1>
              <h2 className="mt-1 whitespace-nowrap text-xs font-bold text-gray-700 print:text-[6.5px]">نظام تكويد الأجهزة الطبية</h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center p-1 print:h-[0.85cm] print:w-[0.85cm]"><img src="/logo.png" alt="Logo" className="max-h-full max-w-full object-contain" /></div>
          </div>

          <div className="mx-auto mb-2 flex overflow-hidden border border-gray-300 bg-gray-50" style={{ width: '3.2cm', height: '2.35cm' }}>
            {device.image_base64 ? <img src={`data:image/jpeg;base64,${device.image_base64}`} alt={device.device_name} className="h-full w-full object-contain" /> : <span className="self-center text-sm text-gray-400">لا توجد صورة للجهاز</span>}
          </div>

          <div className="mb-4">
            {renderRow('اسم الجهاز', device.device_name)}
            {renderRow('كود الجهاز على النظام', device.device_code)}
            {renderRow('المكان داخل القسم', device.location)}
            {renderRow('ماركة الجهاز', device.brand)}
            {renderRow('موديل الجهاز', device.model)}
            {renderRow('رقم مسلسل', device.serial_number)}
            {renderRow('الشركة الوكيل', device.agent_company)}
            {renderRow('شركة الصيانة', device.maintenance_company)}
            {renderRow('موقف الصيانة', device.maintenance_status)}
            {renderRow('بداية التعاقد/الضمان', device.contract_start)}
            {renderRow('انتهاء التعاقد/الضمان', device.contract_end)}
            {renderRow('مسئول الصيانة', device.maintenance_officer)}
            {renderRow('تليفون مسئول الصيانة', device.maintenance_phone)}
          </div>

          <div className="mt-2 flex justify-end"><div className="border border-gray-300 bg-white p-1"><QRCodeSVG value={qrUrl} size={50} /></div></div>
          <button onClick={() => window.print()} className="mt-6 w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 print:hidden">طباعة الكارت</button>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7 print:hidden">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <span className="mb-2 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">بلاغ صيانة</span>
            <h2 className="text-2xl font-bold text-slate-900">الإبلاغ عن عطل</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">اكتب وصف العطل وسيُفتح WhatsApp على هاتفك برسالة جاهزة لمسؤول الصيانة.</p>
          </div>

          <div className="mb-5 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="font-bold text-slate-900">{device.device_name || 'جهاز بدون اسم'}</div>
            <div className="mt-1 text-slate-600">الكود: {device.device_code || '-'} · المكان: {device.location || '-'}</div>
            <div className="mt-1 text-slate-600">مسؤول الصيانة: {device.maintenance_officer || '-'} · {device.maintenance_phone || 'لا يوجد رقم'}</div>
          </div>

          <form onSubmit={sendReport} className="space-y-4">
            <label className="block"><span className="mb-2 block font-bold text-slate-800">وصف العطل *</span><textarea value={fault} onChange={e => setFault(e.target.value)} required rows={5} maxLength={1000} placeholder="مثال: الجهاز لا يعمل وتظهر رسالة خطأ..." className="w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" /></label>
            <label className="block"><span className="mb-2 block font-bold text-slate-800">اسم المُبلّغ (اختياري)</span><input value={reporter} onChange={e => setReporter(e.target.value)} maxLength={100} placeholder="اكتب اسمك" className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" /></label>
            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
            {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">{success}</div>}
            <button disabled={submitting} className="w-full rounded-xl bg-green-600 px-5 py-3.5 text-lg font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-wait disabled:bg-slate-400">{submitting ? 'جاري حفظ البلاغ...' : phone ? 'حفظ البلاغ وفتح WhatsApp' : 'حفظ البلاغ'}</button>
            {!phone && <p className="text-center text-sm text-amber-700">سيُحفظ البلاغ في النظام، لكن لن يفتح WhatsApp لعدم تسجيل رقم الصيانة.</p>}
          </form>
        </section>
      </div>
    </main>
  );
}