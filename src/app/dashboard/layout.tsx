'use client';

import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SidebarNav role={user.role} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <SidebarTrigger />
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline">AttendSync</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant={isOnline ? 'default' : 'secondary'} className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isOnline ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
                )}
              </span>
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

