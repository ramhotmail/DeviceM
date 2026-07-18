'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    if (res.ok) {
      setUsername('');
      setPassword('');
      fetchUsers();
    } else {
      alert('فشل إضافة المستخدم');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchUsers();
    } else {
      alert('فشل الحذف، لا يمكنك حذف حسابك الشخصي');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <Link href="/" className="text-blue-600 hover:underline font-bold">العودة للرئيسية</Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">إضافة مستخدم جديد</h2>
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">اسم المستخدم</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full border p-2 rounded" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full border p-2 rounded" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1">الصلاحية</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full border p-2 rounded">
                <option value="viewer">مشاهد فقط</option>
                <option value="admin">مدير النظام</option>
              </select>
            </div>
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">إضافة</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="p-4 border-b">ID</th>
                <th className="p-4 border-b">اسم المستخدم</th>
                <th className="p-4 border-b">الصلاحية</th>
                <th className="p-4 border-b text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-500">{u.id}</td>
                  <td className="p-4">{u.username}</td>
                  <td className="p-4">{u.role === 'admin' ? 'مدير' : 'مشاهد'}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(u.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
