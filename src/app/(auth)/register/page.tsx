'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', name: '', password: '' });

  const registerMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiClient.post('/auth/register', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || "Erreur lors de l'inscription"),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Créer un compte</h1>
        <p className="text-sm text-gray-500 mb-6">Gratuit, sans carte bancaire</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate(form);
          }}
          className="flex flex-col gap-4"
        >
          {(['name', 'email', 'password'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field === 'name' ? 'Nom complet' : field === 'email' ? 'Email' : 'Mot de passe'}
              </label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {registerMutation.isPending ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
