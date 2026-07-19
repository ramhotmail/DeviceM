'use client';

import React from 'react';
import Link from 'next/link';

export default function AppHeader({ title, subtitle, children, showHome = true }: { title?: string; subtitle?: string; children?: React.ReactNode; showHome?: boolean }) {
  return <header className="app-header print:hidden" dir="rtl">
    <div className="flex min-w-0 items-center gap-4">
      <Link href="/" className="logo-shell" aria-label="الرئيسية"><img src="/ramadan.png" alt="Ramadan Programming" className="h-12 w-auto object-contain sm:h-14" /></Link>
      {title && <div className="hidden min-w-0 border-r border-white/20 pr-4 sm:block"><h1 className="truncate text-lg font-black text-white sm:text-xl">{title}</h1>{subtitle && <p className="mt-1 truncate text-xs text-blue-100">{subtitle}</p>}</div>}
    </div>
    <div className="flex flex-wrap items-center justify-end gap-2">
      {children}
      {showHome && <Link href="/" className="header-button bg-white/15 hover:bg-white/25">الرئيسية</Link>}
    </div>
  </header>;
}