"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, Percent, TrendingUp, TrendingDown, ScanLine, User as UserIcon, Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, collectionGroup } from "firebase/firestore";
import { User, Class, AttendanceRecord } from "@/lib/types";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
import { AddClassDialog } from "@/app/dashboard/classes/components/add-class-dialog";
import { useUsers } from "@/hooks/use-users";
import { useClasses } from "@/hooks/use-classes";
import { useAttendance } from "@/hooks/use-attendance";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { loadFaceApiModels, getFaceEmbedding } from "@/lib/face-api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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

      {/* Face Biometric Enrollment Management */}
      <FaceEnrollmentSection students={users?.filter(u => u.role === 'student') || []} isLoading={isLoadingUsers} />

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

/* ─────────────────────────────────────────────────────────
   Face Biometric Enrollment Section (admin use)
───────────────────────────────────────────────────────── */
function FaceEnrollmentSection({ students, isLoading }: { students: User[]; isLoading: boolean }) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [localEnrolled, setLocalEnrolled] = useState<Set<string>>(new Set());

  // Pre-populate enrolled set from fetched data
  useEffect(() => {
    const enrolled = new Set(students.filter(s => !!s.faceDescriptor).map(s => s.id));
    setLocalEnrolled(enrolled);
  }, [students]);

  const filtered = useMemo(() =>
    students.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.registrationNumber || '').toLowerCase().includes(search.toLowerCase())
    ), [students, search]);

  const enrolledCount = students.filter(s => localEnrolled.has(s.id)).length;

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Face Biometric Enrollment
              </CardTitle>
              <CardDescription>Enroll students' faces for biometric attendance identification.</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {enrolledCount} / {students.length} Enrolled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search by name or registration number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">No students found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {filtered.map(student => {
                const isEnrolled = localEnrolled.has(student.id);
                return (
                  <div
                    key={student.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50",
                      isEnrolled ? "border-green-500/30 bg-green-500/5" : "border-border bg-muted/30"
                    )}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={student.avatarUrl} />
                      <AvatarFallback>{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{student.registrationNumber || student.email}</p>
                    </div>
                    {isEnrolled
                      ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      : <XCircle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                    }
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <FaceEnrollModal
          student={selectedStudent}
          isEnrolled={localEnrolled.has(selectedStudent.id)}
          onClose={() => setSelectedStudent(null)}
          onSuccess={() => {
            setLocalEnrolled(prev => new Set([...prev, selectedStudent.id]));
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Face Enroll Modal — camera + capture for a specific student
───────────────────────────────────────────────────────── */
function FaceEnrollModal({
  student,
  isEnrolled,
  onClose,
  onSuccess,
}: {
  student: User;
  isEnrolled: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);

  useEffect(() => {
    loadFaceApiModels()
      .then(() => setModelsLoaded(true))
      .catch(() => toast({ variant: 'destructive', title: 'Model Error', description: 'Could not load face recognition models.' }))
      .finally(() => setModelsLoading(false));
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access camera.' });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }, []);

  // Auto-start camera when modal opens and models are ready
  useEffect(() => {
    if (modelsLoaded) startCamera();
    return () => stopCamera();
  }, [modelsLoaded]);

  const handleCapture = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setLoading(true);
    try {
      const descriptor = await getFaceEmbedding(videoRef.current);
      if (!descriptor) throw new Error('No face detected. Ensure the student is looking at the camera.');

      const res = await fetch('/api/users/enroll-face-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: student.id, descriptor }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Enrollment failed');
      }

      stopCamera();
      toast({ title: 'Face Enrolled', description: `${student.name}'s face has been registered successfully.` });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Enrollment Failed', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) { stopCamera(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Enroll Face — {student.name}
          </DialogTitle>
          <DialogDescription>
            {isEnrolled
              ? 'This student already has a face registered. Capturing again will update it.'
              : 'Position the student in front of the camera and capture their face.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Student info */}
          <div className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted">
            <Avatar className="h-10 w-10">
              <AvatarImage src={student.avatarUrl} />
              <AvatarFallback>{student.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.registrationNumber || student.email}</p>
            </div>
            <Badge variant={isEnrolled ? 'default' : 'secondary'} className="ml-auto">
              {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
            </Badge>
          </div>

          {/* Camera view */}
          <div className="relative w-full aspect-square max-w-xs rounded-full overflow-hidden border-4 border-primary/30 bg-muted">
            {modelsLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground mt-2">Loading AI models...</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Targeting overlay */}
            {streaming && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-primary/50 animate-[spin_8s_linear_infinite]" />
                <div className="absolute inset-8 rounded-full border border-primary/30" />
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Ensure the student's face is clearly visible, well-lit, and centered in the circle before capturing.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { stopCamera(); onClose(); }} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCapture} disabled={loading || !streaming || !modelsLoaded} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {loading ? 'Enrolling...' : 'Capture & Enroll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
