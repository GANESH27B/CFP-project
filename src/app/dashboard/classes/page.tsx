"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, doc, getDoc } from "firebase/firestore";
import { AddClassDialog } from "@/app/dashboard/classes/components/add-class-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Class, User as UserType } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useClasses } from "@/hooks/use-classes";

function ClassCard({ cls }: { cls: Class & { studentCount?: number }; }) {
  return (
    <Card className="flex flex-col h-full hover:bg-muted/50 transition-colors">
      <Link href={`/dashboard/classes/${cls.id}`} passHref className="flex flex-col flex-grow">
        <CardHeader>
          <CardTitle>Section {cls.section}</CardTitle>
          <CardDescription>{cls.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{cls.studentCount || 0} Student{(cls.studentCount !== 1) ? 's' : ''}</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className="h-5" />
        </CardFooter>
      </Link>
    </Card>
  );
}


function ClassCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="h-5" />
      </CardContent>
      <CardFooter>
        <div className="h-5" />
      </CardFooter>
    </Card>
  );
}

export default function ClassManagementPage() {
  const firestore = useFirestore();
  const { user: currentUser, loading: isUserLoadingAuth } = useUser();

  // Use currentUser directly since it comes from our /api/auth/me (MongoDB)
  const user = currentUser;
  const isLoadingUserRole = isUserLoadingAuth;


  const { classes, isLoading: isLoadingClasses } = useClasses();

  // Fetch all students and faculty from MongoDB for the "Add Class" dialog (only for admins)
  const { users, isLoading: isLoadingUsers } = useUsers();

  const finalIsLoading = isUserLoadingAuth || isLoadingClasses || (user?.role === 'admin' && isLoadingUsers);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            Class Management
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' ? "Create and manage classes and sections." : "View and manage your assigned classes."}
          </p>
        </div>
        {user?.role === 'admin' && <AddClassDialog faculty={users || []} />}
        {user?.role === 'faculty' && <AddClassDialog faculty={[{ id: user.id, name: user.name, email: user.email, role: 'faculty', avatarUrl: user.avatarUrl, status: 'Active' }]} />}
      </div>

      {finalIsLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ClassCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {classes && classes.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {classes.map((cls) => (
                <ClassCard key={cls.id} cls={cls} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md mt-4 flex flex-col items-center gap-4">
              <p>No classes found.</p>
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <>
                  <p className="text-sm">Click the button below to create your first class.</p>
                  {user.role === 'admin' ? (
                    <AddClassDialog faculty={users || []} />
                  ) : (
                    <AddClassDialog faculty={[{ id: user.id || user.uid, name: user.name, email: user.email, role: 'faculty', avatarUrl: user.avatarUrl, status: 'Active' }]} />
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
