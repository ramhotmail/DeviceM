'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';

export default function AddDevice() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    org_name: 'مستشفيات جامعة قناة السويس',
    system_name: 'نظام تكويد الأجهزة الطبية',
    device_name: '',
    device_code: '',
    location: '',
    brand: '',
    model: '',
    serial_number: '',
    agent_company: '',
    maintenance_company: '',
    maintenance_status: '',
    contract_start: '',
    contract_end: '',
    maintenance_officer: '',
    maintenance_phone: '',
    image_base64: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data:image/jpeg;base64, prefix for the database if you want, 
        // but since we render it with the prefix, we can just save the base64 part.
        const base64String = reader.result?.toString().split(',')[1] || '';
        setFormData({ ...formData, image_base64: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/card/${data.id}`);
      } else {
        alert('فشل إضافة الجهاز، تأكد من صلاحياتك');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="app-page">`n      <AppHeader title="إضافة جهاز جديد" subtitle="تسجيل جهاز طبي وإنشاء كارت QR" />
      <div className="surface-panel mx-auto mt-6 max-w-4xl p-5 sm:p-8">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">إضافة جهاز جديد</h1>
          <Link href="/" className="text-blue-600 hover:underline font-bold">العودة للرئيسية</Link>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">اسم الجهاز</label>
            <input type="text" name="device_name" required onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">كود الجهاز على النظام</label>
            <input type="text" name="device_code" required onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">المكان داخل القسم</label>
            <input type="text" name="location" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">ماركة الجهاز</label>
            <input type="text" name="brand" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">موديل الجهاز</label>
            <input type="text" name="model" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">رقم مسلسل</label>
            <input type="text" name="serial_number" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">الشركة الوكيل</label>
            <input type="text" name="agent_company" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">شركة الصيانة</label>
            <input type="text" name="maintenance_company" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">موقف الصيانة</label>
            <select name="maintenance_status" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500">
              <option value="">اختر الحالة...</option>
              <option value="عقد صيانة">عقد صيانة</option>
              <option value="ضمان">ضمان</option>
              <option value="خارج الضمان">خارج الضمان</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">بداية التعاقد/الضمان</label>
            <input type="date" name="contract_start" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">انتهاء التعاقد/الضمان</label>
            <input type="date" name="contract_end" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">مسئول الصيانة</label>
            <input type="text" name="maintenance_officer" onChange={handleChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">تليفون مسئول الصيانة</label>
            <input type="tel" name="maintenance_phone" onChange={handleChange} placeholder="مثال: 01012345678 أو +201012345678" dir="ltr" className="w-full border p-3 rounded outline-none focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-bold mb-2">صورة الجهاز</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border p-3 rounded outline-none focus:border-blue-500" />
            {formData.image_base64 && (
              <div className="mt-4 w-32 h-32 border overflow-hidden rounded">
                <img src={`data:image/jpeg;base64,${formData.image_base64}`} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 mt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition shadow-md disabled:bg-gray-400 text-lg"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ وإنشاء الكارت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
