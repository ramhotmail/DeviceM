'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type User = { id: number; username: string; role: 'admin' | 'viewer'; created_at: string };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const result = (ok = '', fail = '') => { setMessage(ok); setError(fail); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.status === 401) return router.push('/login');
      if (res.status === 403) return result('', 'هذه الصفحة متاحة لمدير النظام فقط.');
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch { result('', 'تعذر تحميل المستخدمين.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); result();
    if (password.length < 8) return result('', 'يجب ألا تقل كلمة المرور عن 8 أحرف.');
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, role })
      });
      const data = await res.json();
      if (!res.ok) return result('', data.error === 'Username already exists' ? 'اسم المستخدم موجود بالفعل.' : 'فشل إنشاء المستخدم.');
      setUsername(''); setPassword(''); setRole('viewer');
      await fetchUsers(); result('تم إنشاء المستخدم بنجاح.');
    } catch { result('', 'تعذر الاتصال بالخادم.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    result();
    if (newPassword.length < 8) return result('', 'يجب ألا تقل كلمة المرور عن 8 أحرف.');
    if (newPassword !== confirmPassword) return result('', 'كلمتا المرور غير متطابقتين.');
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) return result('', 'فشل تغيير كلمة المرور.');
      const changedUser = selectedUser.username;
      setSelectedUser(null); setNewPassword(''); setConfirmPassword('');
      result(`تم تغيير كلمة مرور ${changedUser} بنجاح.`);
    } catch { result('', 'تعذر الاتصال بالخادم.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`هل تريد حذف المستخدم "${user.username}"؟`)) return;
    result();
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    if (res.ok) { await fetchUsers(); result('تم حذف المستخدم.'); }
    else result('', 'تعذر الحذف. لا يمكنك حذف حسابك الحالي.');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1><p className="mt-1 text-sm text-slate-500">إنشاء الحسابات وإدارة كلمات المرور.</p></div>
          <Link href="/" className="rounded-lg bg-white px-4 py-2 font-bold text-blue-700 shadow-sm hover:bg-blue-50">العودة للرئيسية</Link>
        </header>

        {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">{message}</div>}
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>}

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-800">إنشاء مستخدم جديد</h2>
          <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-4 md:items-end">
            <label><span className="mb-1 block text-sm font-bold">اسم المستخدم</span><input value={username} onChange={e => setUsername(e.target.value)} required autoComplete="off" className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500" /></label>
            <label><span className="mb-1 block text-sm font-bold">كلمة المرور</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500" /></label>
            <label><span className="mb-1 block text-sm font-bold">الصلاحية</span><select value={role} onChange={e => setRole(e.target.value as 'admin' | 'viewer')} className="w-full rounded-lg border border-slate-300 p-2.5"><option value="viewer">مشاهد فقط</option><option value="admin">مدير النظام</option></select></label>
            <button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2.5 font-bold text-white hover:bg-green-700 disabled:opacity-60">{saving ? 'جاري الحفظ...' : 'إنشاء المستخدم'}</button>
          </form>
          <p className="mt-3 text-xs text-slate-500">كلمة المرور يجب أن تكون 8 أحرف على الأقل.</p>
        </section>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5"><h2 className="font-bold text-slate-800">المستخدمون الحاليون</h2></div>
          {loading ? <div className="p-10 text-center text-slate-500">جاري التحميل...</div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right">
              <thead className="bg-slate-50 text-sm text-slate-600"><tr><th className="p-4">اسم المستخدم</th><th className="p-4">الصلاحية</th><th className="p-4">تاريخ الإنشاء</th><th className="p-4 text-center">الإجراءات</th></tr></thead>
              <tbody>{users.map(user => <tr key={user.id} className="border-t border-slate-100">
                <td className="p-4 font-bold text-slate-800">{user.username}</td><td className="p-4">{user.role === 'admin' ? 'مدير النظام' : 'مشاهد فقط'}</td><td className="p-4 text-sm text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '—'}</td>
                <td className="p-4"><div className="flex justify-center gap-2"><button onClick={() => { setSelectedUser(user); setNewPassword(''); setConfirmPassword(''); result(); }} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">تغيير كلمة المرور</button><button onClick={() => handleDelete(user)} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-200">حذف</button></div></td>
              </tr>)}</tbody>
            </table></div>
          )}
        </section>
      </div>

      {selectedUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold">تغيير كلمة المرور</h2><p className="mt-1 text-sm text-slate-500">المستخدم: {selectedUser.username}</p>
        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
          <label className="block"><span className="mb-1 block text-sm font-bold">كلمة المرور الجديدة</span><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} autoFocus autoComplete="new-password" className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500" /></label>
          <label className="block"><span className="mb-1 block text-sm font-bold">تأكيد كلمة المرور</span><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-500" /></label>
          <div className="flex gap-3 pt-2"><button disabled={saving} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</button><button type="button" onClick={() => setSelectedUser(null)} className="rounded-lg bg-slate-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-200">إلغاء</button></div>
        </form>
      </div></div>}
    </div>
  );
}