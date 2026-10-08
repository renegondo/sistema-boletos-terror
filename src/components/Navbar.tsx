'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Ticket, 
  Store, 
  Calendar, 
  Users, 
  QrCode, 
  Settings, 
  LogOut, 
  Sparkles
} from 'lucide-react';
import { User } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          const isPublic = pathname === '/' || pathname === '/rodada' || pathname === '/login';
          if (!isPublic) {
            router.push('/login');
          }
        }
      })
      .catch(() => {
        const isPublic = pathname === '/' || pathname === '/rodada' || pathname === '/login';
        if (!isPublic) router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const isPublic = pathname === '/' || pathname === '/rodada' || pathname === '/login';
  if (isPublic || loading || !user) {
    return null;
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Sparkles },
    { href: '/pos', label: 'Taquilla POS', icon: Store, highlight: true },
    { href: '/eventos', label: 'Eventos', icon: Calendar },
    { href: '/vendedores', label: user.role === 'admin' ? 'Vendedores & Comisiones' : 'Mis Comisiones', icon: Users },
    { href: '/scanner', label: 'Cámara QR Acceso', icon: QrCode },
    ...(user.role === 'admin' ? [{ href: '/configuracion', label: 'Evolution API', icon: Settings }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Hi-Boletos <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">POS</span>
              </span>
              <p className="text-[10px] text-slate-500 -mt-0.5 font-medium">Tickets • WhatsApp • Comisiones</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    link.highlight
                      ? isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      : isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${link.highlight ? (isActive ? 'text-white' : 'text-emerald-600') : ''}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User profile & logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{user.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'Vendedor'}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {user.role === 'vendor' ? (
                  user.commission_type === 'percentage' 
                    ? `Comisión: ${user.commission_rate}%` 
                    : `Comisión: $${user.commission_rate} fija`
                ) : (
                  user.email
                )}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 px-2 py-1.5 bg-white">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
