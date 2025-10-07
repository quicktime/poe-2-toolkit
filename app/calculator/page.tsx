'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Calculator redirect page
 * Redirects to the main DPS calculator
 */
export default function CalculatorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dps-calculator');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to calculator...</p>
      </div>
    </div>
  );
}
