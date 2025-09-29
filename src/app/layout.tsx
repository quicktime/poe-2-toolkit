import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PoE 2 Toolkit - Waystone Optimizer & Build Planner',
  description: 'Path of Exile 2 character planning, waystone optimization, and damage calculations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold">PoE 2 Toolkit</h1>
                <div className="flex gap-4">
                  <a href="/" className="hover:text-primary">Home</a>
                  <a href="/waystone" className="hover:text-primary">Waystone Optimizer</a>
                  <a href="/calculator" className="hover:text-primary">DPS Calculator</a>
                  <a href="/planner" className="hover:text-primary">Build Planner</a>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}