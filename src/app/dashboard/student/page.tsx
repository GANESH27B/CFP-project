
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Percent } from "lucide-react";
import { useUser } from "@/firebase";
import { useAttendance } from "@/hooks/use-attendance";
import { useClasses } from "@/hooks/use-classes";
import { collection, query } from "firebase/firestore";
import { AttendanceRecord, Class } from "@/lib/types";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";


export default function StudentDashboardPage() {
  const { user } = useUser();
  const { attendance: attendanceRecords, isLoading: isLoadingAttendance } = useAttendance({ studentId: user?.id });
  const { classes: enrolledClasses, isLoading: isLoadingClasses } = useClasses();

  const isLoading = isLoadingAttendance || isLoadingClasses;


  const { stats, sortedAttendance } = useMemo(() => {
    if (!attendanceRecords) {
      return {
        stats: { totalClasses: 0, overallPercentage: 0 },
        sortedAttendance: []
      };
    }

    const totalClasses = enrolledClasses.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const totalSessions = attendanceRecords.length;

    const newStats = {
      totalClasses: totalClasses,
      overallPercentage: totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0,
    };

    const sorted = [...attendanceRecords].sort((a, b) => {
      try {
        // Sort by date first, then by class name
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return (a.className || "").localeCompare(b.className || "");
      } catch (e) {
        return 0;
      }
    });

    return { stats: newStats, sortedAttendance: sorted };
  }, [attendanceRecords, enrolledClasses]);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight font-headline">Student Dashboard</h1>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
            )}
            <p className="text-xs text-muted-foreground">All your subjects this semester.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-1/4" />
            ) : (
              <div className="text-2xl font-bold">{stats.overallPercentage.toFixed(1)}%</div>
            )}
            <p className="text-xs text-muted-foreground">Across all your classes.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Log</CardTitle>
          <CardDescription>Your day-to-day attendance record for all classes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : sortedAttendance.length > 0 ? (
                sortedAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.date ? format(parseISO(record.date), "PPP") : 'Invalid Date'}
                    </TableCell>
                    <TableCell>{record.className}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === "Present" ? "secondary" : "destructive"}>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
