import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Horror Fest 2026 | After Oficial de la Rodada del Terror',
  description: 'After oficial más esperado de la Rodada del Terror 2026 en Salón del Sindicato del IMSS con Flow Productions. Reserva tus boletos, descorche libre BYOB, Vale Queen, DJ Jhonaz y rifas exclusivas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

