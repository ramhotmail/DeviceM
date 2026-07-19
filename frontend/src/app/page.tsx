'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ClipboardList, FileSpreadsheet, LogOut, MonitorCog, PlusCircle, Printer, Users } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

function DashboardLink({ href, title, description, icon: Icon, color, delay = 0 }: any) {
  return <Link href={href} className="nav-card group" style={{ animationDelay: `${delay}ms` }}>
    <div className={`nav-card-icon ${color}`}><Icon size={30} strokeWidth={2.2} /></div>
    <div className="min-w-0"><h2 className="text-lg font-black text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>
    <span className="nav-card-arrow">←</span>
  </Link>;
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.ok ? res.json() : null).then(data => setCurrentUser(data?.user || null));
    fetch('/api/devices').then(res => res.ok ? res.json() : []).then(data => setDevices(Array.isArray(data) ? data : []));
  }, []);

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };
  const canEdit = ['admin', 'editor'].includes(currentUser?.role);

  return <main className="app-page" dir="rtl">
    <AppHeader showHome={false}><div className="hidden text-sm font-bold text-blue-100 sm:block">مرحبًا، {currentUser?.username || 'المستخدم'}</div><button onClick={logout} className="header-button flex items-center gap-2 bg-red-600 hover:bg-red-700"><LogOut size={16} /> تسجيل خروج</button></AppHeader>
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <section className="dashboard-hero mb-7"><div><span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">لوحة التحكم الرئيسية</span><h1 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">نظام إدارة الأجهزة الطبية</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">اختر القسم المطلوب من البطاقات التالية للوصول السريع إلى جميع وظائف البرنامج.</p></div><div className="hero-stat"><Activity size={28} /><strong>{devices.length}</strong><span>جهاز مسجل</span></div></section>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardLink href="/devices" title="صفحة الأجهزة" description="عرض الأجهزة، البحث، التعديل، الحذف وطباعة الكروت المحددة." icon={MonitorCog} color="bg-blue-600" delay={0} />
        <DashboardLink href="/maintenance" title="بلاغات الصيانة" description="متابعة الأعطال الجديدة وحالات الإصلاح والبلاغات المكتملة." icon={ClipboardList} color="bg-amber-500" delay={70} />
        <DashboardLink href="/report" title="تقارير الأجهزة" description="عرض التقرير الشامل وتصدير Excel وJSON والحفظ PDF." icon={FileSpreadsheet} color="bg-cyan-600" delay={140} />
        <DashboardLink href="/devices" title="طباعة الكروت" description="حدد الأجهزة المطلوبة ثم اطبع كروت 6 × 13 سم بالألوان." icon={Printer} color="bg-purple-600" delay={210} />
        {canEdit && <DashboardLink href="/add" title="إضافة جهاز" description="تسجيل جهاز جديد وبيانات الصيانة وإنشاء رمز QR." icon={PlusCircle} color="bg-emerald-600" delay={280} />}
        {currentUser?.role === 'admin' && <DashboardLink href="/users" title="إدارة المستخدمين" description="إنشاء الحسابات وتعديل الصلاحيات وكلمات المرور." icon={Users} color="bg-slate-700" delay={350} />}
      </section>
    </div>
  </main>;
}