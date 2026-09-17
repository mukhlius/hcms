import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export async function generateMetadata(): Promise<Metadata> {
  let appName = 'HCMS ENTERPRISE';
  let appIcon = '/icon.svg';

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
    const res = await fetch(`${apiUrl}/public/settings`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.app_name) {
        appName = json.data.app_name;
      }
      if (json?.data?.app_icon) {
        appIcon = json.data.app_icon;
      }
    }
  } catch (err) {
    // Fallback bawaan jika API belum siap
  }

  return {
    title: appName,
    description: 'Enterprise Human Capital Management System for Multi-Site Mining Operations',
    icons: {
      icon: appIcon,
      shortcut: appIcon,
      apple: appIcon,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <AppShell>
          {children}
          <GlobalSearchModal />
        </AppShell>
        <ToastContainer />
        <ConfirmDialog />
      </body>
    </html>
  );
}
