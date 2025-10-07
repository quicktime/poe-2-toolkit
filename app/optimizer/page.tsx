'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Optimizer redirect page
 * Redirects to /optimize (the correct route)
 */
export default function OptimizerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/optimize');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to optimizer...</p>
      </div>
    </div>
  );
}
