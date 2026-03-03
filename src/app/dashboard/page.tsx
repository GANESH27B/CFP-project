'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-auth';

// This page acts as a router to the correct dashboard based on the user's role.
export default function DashboardRedirectPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    switch (user.role) {
      case 'admin':
        router.replace('/dashboard/admin');
        break;
      case 'faculty':
        router.replace('/dashboard/faculty');
        break;
      case 'student':
        router.replace('/dashboard/student');
        break;
      default:
        router.replace('/dashboard/profile');
        break;
    }
  }, [user, loading, router]);

  // Return a loading state while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}

