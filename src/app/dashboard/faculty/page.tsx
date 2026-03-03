"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, ScanLine, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/firebase";
import { Class, AttendanceRecord, User } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";
import { useClasses } from "@/hooks/use-classes";
import { useAttendance } from "@/hooks/use-attendance"
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { format, parseISO } from 'date-fns';
import Link from "next/link";

const chartConfig = {
  attendance: {
    label: "Attendance",
    color: "hsl(var(--accent))",
  },
};

export default function FacultyDashboardPage() {
  const { user: currentUser } = useUser();
  const { classes: allSystemClasses, isLoading: isLoadingClasses } = useClasses();
  const { attendance: allSystemAttendance, isLoading: isLoadingAttendance } = useAttendance();

  const facultyClasses = useMemo(() => {
    if (!allSystemClasses || !currentUser) return [];
    return allSystemClasses.filter(cls => cls.facultyId === currentUser.id);
  }, [allSystemClasses, currentUser]);

  const allAttendance = useMemo(() => {
    if (!allSystemAttendance || facultyClasses.length === 0) return [];
    const classIds = new Set(facultyClasses.map(c => c.id));
    return allSystemAttendance.filter(a => classIds.has(a.classId));
  }, [allSystemAttendance, facultyClasses]);

  const studentCount = useMemo(() => {
    if (facultyClasses.length === 0) return 0;
    return facultyClasses.reduce((sum, cls) => sum + ((cls as any).studentCount || 0), 0);
  }, [facultyClasses]);

  const classAttendanceData = useMemo(() => {
    if (!facultyClasses || !allAttendance || facultyClasses.length === 0) return [];

    const classAttendance = facultyClasses.map((cls, index) => {
      const relevantAttendance = allAttendance.filter(a => a.classId === cls.id);
      if (relevantAttendance.length === 0) {
        return { name: cls.name, attendance: 0, fill: `hsl(var(--chart-${(index % 5) + 1}))` };
      }

      const sessions = relevantAttendance.reduce((acc, record) => {
        const date = record.date;
        if (!acc[date]) {
          acc[date] = { present: 0, total: 0 };
        }
        acc[date].total++;
        if (record.status === 'Present') {
          acc[date].present++;
        }
        return acc;
      }, {} as Record<string, { present: number; total: number }>);

      const sessionPercentages = Object.values(sessions).map(
        session => (session.present / session.total) * 100
      );

      if (sessionPercentages.length === 0) {
        return { name: cls.name, attendance: 0, fill: `hsl(var(--chart-${(index % 5) + 1}))` };
      }

      const totalPercentage = sessionPercentages.reduce((sum, p) => sum + p, 0);
      const avg = totalPercentage / sessionPercentages.length;

      return { name: cls.name, attendance: parseFloat(avg.toFixed(1)), fill: `hsl(var(--chart-${(index % 5) + 1}))` };
    });

    classAttendance.forEach((cls, index) => {
      const key = cls.name.replace(/\s+/g, '').toLowerCase();
      if (!(chartConfig as any)[key]) {
        (chartConfig as any)[key] = { label: cls.name, color: `hsl(var(--chart-${(index % 5) + 1}))` };
      }
    });

    return classAttendance.sort((a, b) => b.attendance - a.attendance);

  }, [facultyClasses, allAttendance]);

  const overallAttendanceData = useMemo(() => {
    if (!allAttendance || allAttendance.length === 0) return [];

    const attendanceByMonth = allAttendance.reduce((acc, record) => {
      try {
        const month = format(parseISO(record.date), 'yyyy-MM');
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(record);
      } catch (e) {
        // Ignore invalid dates
      }
      return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    const monthlyAverages = Object.entries(attendanceByMonth).map(([month, records]) => {
      const sessions = records.reduce((acc, record) => {
        const sessionKey = `${record.classId}-${record.date}`;
        if (!acc[sessionKey]) {
          acc[sessionKey] = { present: 0, total: 0 };
        }
        acc[sessionKey].total++;
        if (record.status === 'Present') {
          acc[sessionKey].present++;
        }
        return acc;
      }, {} as Record<string, { present: number, total: number }>);

      const sessionPercentages = Object.values(sessions).map(
        session => (session.present / session.total) * 100
      );

      if (sessionPercentages.length === 0) {
        return { date: format(parseISO(month + '-01'), 'MMM'), attendance: 0 };
      }

      const totalPercentage = sessionPercentages.reduce((sum, p) => sum + p, 0);
      const avg = totalPercentage / sessionPercentages.length;
      return { date: format(parseISO(month + '-01'), 'MMM'), attendance: parseFloat(avg.toFixed(1)) };
    });

    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthlyAverages.sort((a, b) => monthOrder.indexOf(a.date) - monthOrder.indexOf(b.date));

  }, [allAttendance]);

  const isLoading = isLoadingClasses || isLoadingAttendance;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight font-headline">Faculty Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{facultyClasses?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{studentCount}</div>}
            <p className="text-xs text-muted-foreground">Across all your classes</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild variant="outline" className="flex-1 gap-2 h-14">
              <Link href="/dashboard/attendance">
                <UserIcon className="h-4 w-4 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-foreground">Face Scanning</span>
                  <span className="text-[10px] text-muted-foreground">Scan Face for Info</span>
                </div>
              </Link>
            </Button>
            <Button asChild className="flex-1 gap-2 h-14 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dashboard/attendance">
                <ScanLine className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold">QR Attendance</span>
                  <span className="text-[10px] opacity-80">Quick QR Check-in</span>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Class Attendance</CardTitle>
            <CardDescription>Average attendance percentage for your classes.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
              classAttendanceData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                  <BarChart data={classAttendanceData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 6)} />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="attendance" radius={8} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
                  No attendance data to display.
                </div>
              )
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overall Attendance Trend</CardTitle>
            <CardDescription>Your students' monthly attendance trend.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
              overallAttendanceData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                  <LineChart data={overallAttendanceData} accessibilityLayer margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
                  Not enough data for a trend graph.
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Classes & Students</CardTitle>
          <CardDescription>A detailed list of your classes and assigned students.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : facultyClasses.length > 0 ? (
            <div className="space-y-8">
              {facultyClasses.map((cls) => (
                <div key={cls.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">Section {cls.section} • {(cls as any).studentCount || 0} Students</p>
                    </div>
                    <Link href={`/dashboard/classes/${cls.id}`} className="text-xs text-primary hover:underline">
                      Manage Class
                    </Link>
                  </div>
                  <ClassStudentTable classId={cls.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No classes assigned to you.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClassStudentTable({ classId }: { classId: string }) {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/classes/${classId}`);
        if (response.ok) {
          const data = await response.json();
          setStudents(data.enrolledStudents || []);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [classId]);

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (students.length === 0) return <p className="text-sm text-muted-foreground italic">No students enrolled.</p>;

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead>Reg. Number</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={student.avatarUrl} />
                    <AvatarFallback className="text-[10px]">{student.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{student.name}</span>
                    <span className="text-[10px] text-muted-foreground">{student.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{student.registrationNumber || "N/A"}</TableCell>
              <TableCell>
                <Badge variant={student.status === 'Active' ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                  {student.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
