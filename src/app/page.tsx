'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import CampaignsDashboard from '@/components/campaigns-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/header';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <main className="w-full max-w-7xl flex-1 space-y-8 p-4 md:p-8">
            <Skeleton className="h-12 w-1/4" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CampaignsDashboard />
      </main>
    </div>
  );
}
