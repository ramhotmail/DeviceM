'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const initialData = { org_name: '', system_name: '', device_name: '', device_code: '', location: '', brand: '', model: '', serial_number: '', agent_company: '', maintenance_company: '', maintenance_status: '', contract_start: '', contract_end: '', maintenance_officer: '', maintenance_phone: '', image_base64: '' };
const fields = [
  ['device_name', 'اسم الجهاز', 'text', true], ['device_code', 'كود الجهاز على النظام', 'text', true],
  ['location', 'المكان داخل القسم', 'text', false], ['brand', 'ماركة الجهاز', 'text', false],
  ['model', 'موديل الجهاز', 'text', false], ['serial_number', 'الرقم المسلسل', 'text', false],
  ['agent_company', 'الشركة الوكيل', 'text', false], ['maintenance_company', 'شركة الصيانة', 'text', false],
  ['contract_start', 'بداية التعاقد / الضمان', 'date', false], ['contract_end', 'انتهاء التعاقد / الضمان', 'date', false],
  ['maintenance_officer', 'مسؤول الصيانة', 'text', false], ['maintenance_phone', 'هاتف مسؤول الصيانة', 'tel', false]
] as const;

export default function EditDevice() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [formData, setFormData] = useState<any>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/devices/${id}`).then(async res => {
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFormData({ ...initialData, ...data, contract_start: String(data.contract_start || '').slice(0, 10), contract_end: String(data.contract_end || '').slice(0, 10) });
    }).catch(() => setError('تعذر تحميل بيانات الجهاز.')).finally(() => setLoading(false));
  }, [id]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData((current: any) => ({ ...current, [event.target.name]: event.target.value }));
  const imageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData((current: any) => ({ ...current, image_base64: String(reader.result || '').split(',')[1] || '' }));
    reader.readAsDataURL(file);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`/api/devices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.status === 403) return setError('التعديل متاح لمدير النظام ومدخل البيانات فقط.');
      if (!res.ok) throw new Error();
      router.push(`/card/${id}`); router.refresh();
    } catch { setError('تعذر حفظ التعديلات. برجاء المحاولة مرة أخرى.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-12 text-center font-bold">جاري تحميل بيانات الجهاز...</div>;
  return <main className="min-h-screen bg-slate-100 p-4 sm:p-8" dir="rtl"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-5 shadow-lg sm:p-8">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4"><div><h1 className="text-2xl font-bold text-slate-900">تعديل بيانات الجهاز</h1><p className="mt-1 text-sm text-slate-500">عدّل البيانات المطلوبة ثم اضغط حفظ.</p></div><div className="flex gap-2"><Link href={`/card/${id}`} className="rounded-lg bg-blue-50 px-4 py-2 font-bold text-blue-700">عرض الكارت</Link><Link href="/" className="rounded-lg bg-slate-100 px-4 py-2 font-bold">إلغاء</Link></div></header>
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 font-bold text-red-700">{error}</div>}
    <form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {fields.map(([name, label, type, required]) => <label key={name} className="block"><span className="mb-2 block font-bold text-slate-700">{label}</span><input name={name} type={type} value={formData[name] || ''} onChange={change} required={required} dir={type === 'tel' ? 'ltr' : undefined} className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500" /></label>)}
      <label className="block"><span className="mb-2 block font-bold text-slate-700">حالة الصيانة</span><select name="maintenance_status" value={formData.maintenance_status || ''} onChange={change} className="w-full rounded-lg border border-slate-300 p-3"><option value="">اختر الحالة...</option><option value="عقد صيانة">عقد صيانة</option><option value="ضمان">ضمان</option><option value="خارج الضمان">خارج الضمان</option></select></label>
      <div className="md:col-span-2"><span className="mb-2 block font-bold text-slate-700">صورة الجهاز</span><input type="file" accept="image/*" onChange={imageChange} className="w-full rounded-lg border border-slate-300 p-3" />{formData.image_base64 && <div className="mt-3 flex items-start gap-3"><img src={`data:image/jpeg;base64,${formData.image_base64}`} alt="صورة الجهاز" className="h-32 w-32 rounded-lg border object-contain" /><button type="button" onClick={() => setFormData((current: any) => ({ ...current, image_base64: '' }))} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">حذف الصورة</button></div>}</div>
      <div className="md:col-span-2 mt-3"><button disabled={saving} className="w-full rounded-xl bg-blue-700 py-4 text-lg font-bold text-white hover:bg-blue-800 disabled:opacity-50">{saving ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات'}</button></div>
    </form>
  </div></main>;
}