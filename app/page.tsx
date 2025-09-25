'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-center">
        <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Path of Exile 2 Toolkit
        </h1>
        <p className="text-xl text-gray-300 mb-4">
          The ultimate character planning and build optimization platform
        </p>
        <p className="text-sm text-blue-400 mb-12 font-semibold">
          ⚡ Built for PoE 2 Early Access (Patch 0.3+) - Includes all new mechanics!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="text-3xl mb-3">⚔️</div>
            <h3 className="text-lg font-semibold text-white mb-2">PoE 2 DPS Calculator</h3>
            <p className="text-gray-400 text-sm">
              Combo system, spirit efficiency, and all new PoE 2 damage mechanics
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="text-3xl mb-3">💎</div>
            <h3 className="text-lg font-semibold text-white mb-2">Spirit & Uncut Gems</h3>
            <p className="text-gray-400 text-sm">
              Optimize spirit reservations and uncut gem support configurations
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Honor & Defenses</h3>
            <p className="text-gray-400 text-sm">
              Calculate honor resistance, dodge rolls, and PoE 2 defensive layers
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={login}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>

          <div className="text-sm text-gray-400">
            <Link href="/setup" className="hover:text-white transition-colors">
              Need help with setup? View guide →
            </Link>
          </div>
        </div>

        <div className="mt-16 text-xs text-gray-500">
          <p>This is an unofficial fan-made tool. Not affiliated with Grinding Gear Games.</p>
        </div>
      </div>
    </main>
  );
}