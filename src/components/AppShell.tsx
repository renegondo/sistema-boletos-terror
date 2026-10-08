'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHorrorLanding = pathname === '/' || pathname === '/rodada';

  if (isHorrorLanding) {
    return (
      <div className="min-h-screen bg-[#07070a] text-slate-100 w-full overflow-x-hidden selection:bg-red-600 selection:text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen antialiased flex flex-col selection:bg-indigo-600 selection:text-white">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
