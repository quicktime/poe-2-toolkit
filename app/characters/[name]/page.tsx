'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CharacterDetailsComponent from '@/components/CharacterDetails';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, use } from 'react';

export default function CharacterPage({ params }: { params: Promise<{ name: string }> }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <CharacterDetailsComponent characterName={resolvedParams.name} />
      </div>
    </div>
  );
}