'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';

type Role = 'admin' | 'editor' | 'viewer';
type User = { id: number; username: string; role: Role; created_at: string };
const roleLabel: Record<Role, string> = { admin: 'مدير النظام', editor: 'مدخل بيانات', viewer: 'مشاهد فقط' };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [editing, setEditing] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<Role>('viewer');
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
      if (res.status === 403) return router.push('/');
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch { result('', 'تعذر تحميل المستخدمين.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault(); result();
    if (password.length < 8) return result('', 'يجب ألا تقل كلمة المرور عن 8 أحرف.');
    setSaving(true);
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password, role }) });
      const data = await res.json();
      if (!res.ok) return result('', data.error === 'Username already exists' ? 'اسم المستخدم موجود بالفعل.' : 'فشل إنشاء المستخدم.');
      setUsername(''); setPassword(''); setRole('viewer'); await fetchUsers(); result('تم إنشاء المستخدم بنجاح.');
    } catch { result('', 'تعذر الاتصال بالخادم.'); }
    finally { setSaving(false); }
  };

  const openEdit = (user: User) => {
    setEditing(user); setEditUsername(user.username); setEditRole(user.role); setNewPassword(''); setConfirmPassword(''); result();
  };

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    result();
    if (!editUsername.trim()) return result('', 'اسم المستخدم مطلوب.');
    if (newPassword && newPassword.length < 8) return result('', 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.');
    if (newPassword !== confirmPassword) return result('', 'كلمتا المرور غير متطابقتين.');
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: editUsername.trim(), role: editRole, password: newPassword || undefined }) });
      const data = await res.json();
      if (!res.ok) {
        const messages: Record<string, string> = { 'Username already exists': 'اسم المستخدم موجود بالفعل.', 'Cannot remove your own admin role': 'لا يمكنك إزالة صلاحية المدير من حسابك الحالي.' };
        return result('', messages[data.error] || 'فشل تعديل المستخدم.');
      }
      setEditing(null); await fetchUsers(); result('تم تحديث بيانات المستخدم بنجاح.');
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

  return <main className="app-page" dir="rtl"><AppHeader title="إدارة المستخدمين" subtitle="الحسابات والصلاحيات وكلمات المرور" /><div className="mx-auto max-w-5xl p-4 sm:p-8">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1><p className="mt-1 text-sm text-slate-500">إنشاء المستخدمين وتعديل أسمائهم وصلاحياتهم وكلمات المرور.</p></div><Link href="/" className="rounded-lg bg-white px-4 py-2 font-bold text-blue-700 shadow-sm">العودة للرئيسية</Link></header>
    {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">{message}</div>}{error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>}

    <section className="mb-6 rounded-xl bg-white p-5 shadow-sm sm:p-6"><h2 className="mb-4 text-lg font-bold">إنشاء مستخدم جديد</h2><form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-4 md:items-end">
      <label><span className="mb-1 block text-sm font-bold">اسم المستخدم</span><input value={username} onChange={e => setUsername(e.target.value)} required className="w-full rounded-lg border p-2.5" /></label>
      <label><span className="mb-1 block text-sm font-bold">كلمة المرور</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full rounded-lg border p-2.5" /></label>
      <label><span className="mb-1 block text-sm font-bold">الصلاحية</span><select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full rounded-lg border p-2.5"><option value="viewer">مشاهد فقط</option><option value="editor">مدخل بيانات</option><option value="admin">مدير النظام</option></select></label>
      <button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2.5 font-bold text-white disabled:opacity-60">{saving ? 'جاري الحفظ...' : 'إنشاء المستخدم'}</button>
    </form></section>

    <section className="overflow-hidden rounded-xl bg-white shadow-sm"><div className="border-b p-5 font-bold">المستخدمون الحاليون</div>{loading ? <div className="p-10 text-center text-slate-500">جاري التحميل...</div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-right"><thead className="bg-slate-50 text-sm"><tr><th className="p-4">اسم المستخدم</th><th className="p-4">الصلاحية</th><th className="p-4">تاريخ الإنشاء</th><th className="p-4 text-center">الإجراءات</th></tr></thead><tbody>{users.map(user => <tr key={user.id} className="border-t"><td className="p-4 font-bold">{user.username}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{roleLabel[user.role] || user.role}</span></td><td className="p-4 text-sm text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : '—'}</td><td className="p-4"><div className="flex justify-center gap-2"><button onClick={() => openEdit(user)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">تعديل</button><button onClick={() => handleDelete(user)} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700">حذف</button></div></td></tr>)}</tbody></table></div>}</section>
  </div>

  {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">تعديل المستخدم</h2><p className="mt-1 text-sm text-slate-500">يمكن ترك كلمة المرور فارغة للاحتفاظ بالحالية.</p><form onSubmit={handleEdit} className="mt-5 space-y-4">
    <label className="block"><span className="mb-1 block text-sm font-bold">اسم المستخدم</span><input value={editUsername} onChange={e => setEditUsername(e.target.value)} required autoFocus className="w-full rounded-lg border p-2.5" /></label>
    <label className="block"><span className="mb-1 block text-sm font-bold">الصلاحية</span><select value={editRole} onChange={e => setEditRole(e.target.value as Role)} className="w-full rounded-lg border p-2.5"><option value="viewer">مشاهد فقط</option><option value="editor">مدخل بيانات</option><option value="admin">مدير النظام</option></select></label>
    <label className="block"><span className="mb-1 block text-sm font-bold">كلمة مرور جديدة (اختياري)</span><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} autoComplete="new-password" className="w-full rounded-lg border p-2.5" /></label>
    <label className="block"><span className="mb-1 block text-sm font-bold">تأكيد كلمة المرور</span><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-lg border p-2.5" /></label>
    <div className="flex gap-3 pt-2"><button disabled={saving} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white disabled:opacity-60">{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg bg-slate-100 px-4 py-2.5 font-bold">إلغاء</button></div>
  </form></div></div>}
  </main>;
}