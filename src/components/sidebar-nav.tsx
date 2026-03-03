"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  BookOpen,
  ScanLine,
  PieChart,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/lib/types";
import { Separator } from "./ui/separator";
import { logout } from "@/hooks/use-auth";

interface SidebarNavProps {
  role: UserRole;
}

const adminNav = [
  { href: "/dashboard/admin", icon: Home, label: "Dashboard" },
  { href: "/dashboard/attendance", icon: ScanLine, label: "Take Attendance" },
  { href: "/dashboard/users", icon: Users, label: "User Management" },
  { href: "/dashboard/classes", icon: BookOpen, label: "Class Management" },
  { href: "/dashboard/analytics", icon: PieChart, label: "Analytics & Reports" },
];

const facultyNav = [
  { href: "/dashboard/faculty", icon: Home, label: "Dashboard" },
  { href: "/dashboard/attendance", icon: ScanLine, label: "Take Attendance" },
  { href: "/dashboard/classes", icon: BookOpen, label: "My Classes" },
];

const studentNav = [
  { href: "/dashboard/student", icon: Home, label: "Dashboard" },
];

const commonNav = [
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

const navItems = {
  admin: [...adminNav, ...commonNav],
  faculty: [...facultyNav, ...commonNav],
  student: [...studentNav, ...commonNav],
};

export function SidebarNav({ role = "admin" }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = navItems[role] || navItems.admin;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-semibold font-headline">AttendSync</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
