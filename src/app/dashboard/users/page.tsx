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
import { createColumns } from "./components/columns";
import { AddUserDialog } from "./components/add-user-dialog";
import { EditUserDialog } from "./components/edit-user-dialog";
import { ViewUserDialog } from "./components/view-user-dialog";
import { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, GraduationCap, UserCheck } from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Dialog state
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users as User[]);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* ── handlers ── */
  const handleEditSuccess = useCallback((updated: User) => {
    setUsers((prev) =>
      prev ? prev.map((u) => (u.id === updated.id ? updated : u)) : prev
    );
    setEditUser(null);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete the user.");
      }
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== deleteUser.id) : prev));
      toast({
        title: "User Deleted",
        description: `${deleteUser.name}'s account has been removed.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Could not delete the user.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteUser(null);
    }
  };

  /* ── derived lists ── */
  const students = users?.filter((u) => u.role === "student") ?? [];
  const faculty = users?.filter((u) => u.role === "faculty") ?? [];
  const admins = users?.filter((u) => u.role === "admin") ?? [];

  /* ── columns (memoised so they're stable between renders) ── */
  const columns = useMemo(
    () =>
      createColumns({
        onView: (u) => setViewUser(u),
        onEdit: (u) => setEditUser(u),
        onDelete: (u) => setDeleteUser(u),
      }),
    []
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">User Management</CardTitle>
            <CardDescription>
              Add, edit, and manage faculty and student accounts.
            </CardDescription>
          </div>
          <AddUserDialog onSuccess={loadUsers} />
        </CardHeader>

        <CardContent>
          {/* Stats bar */}
          {!isLoading && users && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Students</p>
                  <p className="font-bold text-lg leading-tight">{students.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Faculty</p>
                  <p className="font-bold text-lg leading-tight">{faculty.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <UserCheck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Admins</p>
                  <p className="font-bold text-lg leading-tight">{admins.length}</p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="students">
            <TabsList className="grid w-full grid-cols-3 md:max-w-[480px]">
              <TabsTrigger value="students">
                Students
                {!isLoading && (
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {students.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="faculty">
                Faculty
                {!isLoading && (
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {faculty.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="admins">
                Admins
                {!isLoading && (
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {admins.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-10 w-1/3" />
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
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

      {/* View dialog */}
      {viewUser && (
        <ViewUserDialog
          user={viewUser}
          open={!!viewUser}
          onOpenChange={(o) => { if (!o) setViewUser(null); }}
        />
      )}

      {/* Edit dialog */}
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(o) => { if (!o) setEditUser(null); }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => { if (!o && !isDeleting) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold">{deleteUser?.name}</span>
              &apos;s account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
