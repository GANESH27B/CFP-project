"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, Percent, TrendingUp, TrendingDown, ScanLine, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, collectionGroup } from "firebase/firestore";
import { User, Class, AttendanceRecord } from "@/lib/types";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
import { AddClassDialog } from "@/app/dashboard/classes/components/add-class-dialog";
import { useUsers } from "@/hooks/use-users";
import { useClasses } from "@/hooks/use-classes";
import { useAttendance } from "@/hooks/use-attendance";
import Link from "next/link";

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "hsl(var(--accent))",
  },
};

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const { users, isLoading: isLoadingUsers } = useUsers();

  const { classes, isLoading: isLoadingClasses } = useClasses();
  const { attendance, isLoading: isLoadingAttendance } = useAttendance();

  const isLoading = isLoadingUsers || isLoadingClasses || isLoadingAttendance;

  const stats = useMemo(() => {
    if (!users || !classes || !attendance) {
      return {
        totalStudents: 0,
        totalFaculty: 0,
        totalClasses: 0,
        avgAttendance: 0,
      };
    }

    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalFaculty = users.filter(u => u.role === 'faculty').length;
    const totalClasses = classes.length;

    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const avgAttendance = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0;

    return {
      totalStudents,
      totalFaculty,
      totalClasses,
      avgAttendance,
    };
  }, [users, classes, attendance]);

  const classAttendanceData = useMemo(() => {
    if (!classes || !attendance || classes.length === 0) return [];

    const classAttendance = classes.map(cls => {
      const relevantAttendance = attendance.filter(a => a.classId === cls.id);
      if (relevantAttendance.length === 0) {
        return { name: cls.name, attendance: 0 };
      }
      const presentCount = relevantAttendance.filter(a => a.status === 'Present').length;
      const avg = (presentCount / relevantAttendance.length) * 100;
      return { name: cls.name, attendance: parseFloat(avg.toFixed(1)), fill: `hsl(var(--chart-${(classes.indexOf(cls) % 5) + 1}))` };
    });

    // Update chartConfig dynamically
    classes.forEach((cls, index) => {
      const key = cls.name.replace(/\s+/g, '').toLowerCase();
      if (!chartConfig[key as keyof typeof chartConfig]) {
        (chartConfig as any)[key] = { label: cls.name, color: `hsl(var(--chart-${(index % 5) + 1}))` };
      }
    });

    return classAttendance.sort((a, b) => b.attendance - a.attendance).slice(0, 5); // Get top 5

  }, [classes, attendance]);

  const overallAttendanceData = useMemo(() => {
    if (!attendance || attendance.length === 0) return [];

    const attendanceByMonth: { [key: string]: { present: number, total: number } } = {};

    attendance.forEach(record => {
      try {
        const month = format(parseISO(record.date), 'MMM');
        if (!attendanceByMonth[month]) {
          attendanceByMonth[month] = { present: 0, total: 0 };
        }
        attendanceByMonth[month].total++;
        if (record.status === 'Present') {
          attendanceByMonth[month].present++;
        }
      } catch (e) {
        // Ignore invalid date formats
      }
    });

    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return monthOrder
      .filter(month => attendanceByMonth[month])
      .map(month => {
        const { present, total } = attendanceByMonth[month];
        return {
          date: month,
          attendance: parseFloat(((present / total) * 100).toFixed(1)),
        };
      });

  }, [attendance]);


  const facultyMembers = useMemo(() => users?.filter(u => u.role === 'faculty') || [], [users]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground">Create and manage classes and sections.</p>
        </div>
        <AddClassDialog faculty={users || []} />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalStudents}</div>}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Currently in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalFaculty}</div>}
            <p className="text-xs text-muted-foreground">Active and teaching</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.totalClasses}</div>}
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.avgAttendance.toFixed(1)}%</div>}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Across all classes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <CardDescription>Instant access to identification and attendance tools.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild variant="outline" className="flex-1 gap-2 h-16">
            <Link href="/dashboard/attendance">
              <UserIcon className="h-5 w-5 text-primary" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-foreground">Face Scanning</span>
                <span className="text-xs text-muted-foreground">Identify students via face scan</span>
              </div>
            </Link>
          </Button>
          <Button asChild className="flex-1 gap-2 h-16 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard/attendance">
              <ScanLine className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold">QR Attendance</span>
                <span className="text-xs opacity-80">Mark attendance with QR codes</span>
              </div>
            </Link>
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Class Attendance Overview</CardTitle>
            <CardDescription>
              Average attendance for top 5 classes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                <BarChart data={classAttendanceData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 6)} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="attendance" radius={8} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Overall Attendance Trend</CardTitle>
            <CardDescription>Monthly attendance trend for the current year.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                <LineChart data={overallAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip cursor={false} content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Class Management</h2>
        </div>

        {isLoadingClasses ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes?.map((cls) => (
              <Card key={cls.id} className="hover:bg-muted/50 transition-colors">
                <Link href={`/dashboard/classes/${cls.id}`} passHref>
                  <CardHeader>
                    <CardTitle className="text-lg">Section {cls.section}</CardTitle>
                    <CardDescription>{cls.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{cls.studentIds?.length || 0} Students</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
            {classes?.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                No classes created yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
