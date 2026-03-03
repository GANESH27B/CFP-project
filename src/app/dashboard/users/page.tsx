"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { AddUserDialog } from "./components/add-user-dialog";
import { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/users", { credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to load users");
        }
        const data = await res.json();
        if (!cancelled) {
          setUsers(data.users as User[]);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setUsers([]);
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const students = users?.filter((user) => user.role === "student") || [];
  const faculty = users?.filter((user) => user.role === "faculty") || [];
  const admins = users?.filter((user) => user.role === "admin") || [];

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Add, edit, and manage faculty and student accounts.
          </CardDescription>
        </div>
        <AddUserDialog />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="students">
          <TabsList className="grid w-full grid-cols-3 md:max-w-[480px]">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>
          {isLoading ? (
            <div className="mt-4 space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <TabsContent value="students">
                <DataTable columns={columns} data={students} />
              </TabsContent>
              <TabsContent value="faculty">
                <DataTable columns={columns} data={faculty} />
              </TabsContent>
              <TabsContent value="admins">
                <DataTable columns={columns} data={admins} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
