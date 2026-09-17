'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch {
      // In compliance with section 11: don't reveal user existence!
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke halaman masuk</span>
        </Link>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Periksa Kotak Masuk Email Anda</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jika akun dengan alamat email <span className="font-semibold text-slate-700">{email}</span> terdaftar di HCMS, tautan instruksi pemulihan kata sandi telah dikirimkan.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Kembali ke Halaman Masuk
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Lupa Kata Sandi?</h2>
              <p className="mt-1 text-xs text-slate-500">
                Masukkan alamat email resmi korporat Anda untuk menerima instruksi pemulihan kata sandi.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Resmi Perusahaan"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@cmn.mining.local"
                leftIcon={<Mail className="h-4 w-4" />}
                required
                autoFocus
              />

              <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                Kirim Instruksi Pemulihan
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
