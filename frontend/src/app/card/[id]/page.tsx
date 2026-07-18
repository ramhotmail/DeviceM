'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function CardPage() {
  const { id } = useParams();
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDevice() {
      try {
        const res = await fetch(`/api/devices/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDevice(data);
        }
      } catch (error) {
        console.error('Failed to fetch device', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDevice();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center font-bold">جاري تحميل بيانات الكارت...</div>;
  }

  if (!device) {
    return <div className="p-10 text-center text-red-500 font-bold">لم يتم العثور على الجهاز!</div>;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const qrUrl = `${origin}/card/${id}`;

  const renderRow = (label: string, value: string | null) => (
    <div className="flex justify-between items-center border-b border-gray-300 py-1 text-[10px] print:text-[9px]">
      <div className="text-gray-800 font-bold whitespace-nowrap ml-2">{label} :</div>
      <div className="text-gray-900 font-bold whitespace-nowrap overflow-hidden text-ellipsis">{value || '-'}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      {/* Card Container - Mobile/ID Size */}
      <div className="bg-white shadow-xl border-2 border-gray-800 p-4 w-[350px] relative mx-auto print:shadow-none print:border-2 print:w-[8cm] print:p-3 print:m-0">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-1 mb-2">
          <div className="text-right">
            <h1 className="text-base font-extrabold text-gray-900 leading-tight">مستشفيات جامعة قناة السويس</h1>
            <h2 className="text-sm font-bold text-gray-700 mt-1">نظام تكويد الأجهزة الطبية</h2>
          </div>
          {/* Logo container */}
          <div className="w-14 h-14 flex items-center justify-center p-1">
            <img src="/logo.png" alt="Logo" className="max-w-full max-h-full object-contain" />
          </div>
        </div>

        {/* Device Image */}
        <div className="flex justify-center mb-2 mx-auto overflow-hidden border border-gray-300 bg-gray-50" style={{ width: '4cm', height: '3cm' }}>
          {device.image_base64 ? (
            <img src={`data:image/jpeg;base64,${device.image_base64}`} alt={device.device_name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-gray-400 self-center text-sm">لا توجد صورة للجهاز</span>
          )}
        </div>

        {/* Data Table */}
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

        {/* QR Code */}
        <div className="flex justify-end mt-2">
          <div className="p-1 border border-gray-300 bg-white">
            <QRCodeSVG value={qrUrl} size={70} />
          </div>
        </div>

        {/* Print Button (Hidden in Print) */}
        <button 
          onClick={() => window.print()}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg print:hidden transition-all shadow-md text-sm"
        >
          طباعة الكارت
        </button>
      </div>
    </div>
  );
}
