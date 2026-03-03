"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { QrCode, ScanLine, ListChecks, StopCircle, AlertTriangle, UserX, UserCheck, Loader2, CalendarIcon, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useClasses } from "@/hooks/use-classes";
import { useAttendance } from "@/hooks/use-attendance";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/firebase";
import { Class, User } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { loadFaceApiModels, getFaceEmbedding } from "@/lib/face-api";

const scannerConfig = {
  fps: 10,
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.max(50, Math.min(250, minEdge * 0.7));
    return {
      width: qrboxSize,
      height: qrboxSize,
    };
  },
  supportedScanTypes: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.UPC_A,
  ]
};

type ScanResult = {
  status: "success" | "not_found" | "already_marked" | "error";
  message: string;
}

type ScannerState = 'IDLE' | 'INITIALIZING' | 'SCANNING' | 'ERROR';


export default function AttendancePage() {
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<Date | undefined>(new Date());
  const [manualRegNumber, setManualRegNumber] = useState("");
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [loadingFaceId, setLoadingFaceId] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>('IDLE');
  const [useScanner, setUseScanner] = useState(true);
  const [isFaceMode, setIsFaceMode] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await loadFaceApiModels();
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    };
    loadModels();
  }, []);

  const { classes: allSystemClasses, isLoading: isLoadingClasses } = useClasses();

  const facultyClasses = useMemo(() => {
    if (!allSystemClasses || !currentUser) return [];
    return allSystemClasses.filter(c => c.facultyId === currentUser.id);
  }, [allSystemClasses, currentUser]);

  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);

  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!selectedClassId) {
        setEnrolledStudents([]);
        return;
      }
      try {
        setIsLoadingEnrolled(true);
        const response = await fetch(`/api/classes/${selectedClassId}`);
        if (!response.ok) throw new Error("Failed to fetch students");
        const data = await response.json();
        setEnrolledStudents(data.enrolledStudents || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoadingEnrolled(false);
      }
    };
    fetchEnrolledStudents();
  }, [selectedClassId]);

  const formattedSessionDate = useMemo(() => sessionDate ? format(sessionDate, "yyyy-MM-dd") : "", [sessionDate]);

  const { attendance: attendanceRecords, isLoading: isLoadingAttendance, refresh: refreshAttendance } = useAttendance({
    classId: selectedClassId || undefined,
    date: formattedSessionDate || undefined
  });

  const presentStudentIds = useMemo(() =>
    new Set(attendanceRecords?.filter(r => r.status === 'Present').map(r => r.studentId) || [])
    , [attendanceRecords]);

  const studentMap = useMemo(() =>
    new Map(enrolledStudents?.map(s => [s.id, s]) || [])
    , [enrolledStudents]);

  const handleClassSelection = (classId: string) => {
    setSelectedClassId(classId);
    if (!sessionDate) {
      setSessionDate(new Date());
    }
    setSessionActive(true);
    setLastScanResult(null);
    toast({
      title: "Session Active",
      description: "You can now manage attendance for the selected class and date.",
    })
  };

  const setAttendanceStatus = useCallback(async (student: User, status: 'Present' | 'Absent') => {
    if (!selectedClassId || !formattedSessionDate || !currentUser) return;

    const selectedClass = facultyClasses?.find(c => c.id === selectedClassId);

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          classId: selectedClassId,
          className: selectedClass?.name || "Unknown Class",
          date: formattedSessionDate,
          status: status,
        }),
      });

      if (!response.ok) throw new Error("Failed to update attendance");

      refreshAttendance();

      if (status === 'Absent') {
        toast({ title: "Marked Absent", description: `${student.name} marked as absent.` });
      } else {
        toast({ title: "Marked Present", description: `${student.name} marked as present.`, className: "bg-green-100 dark:bg-green-900 border-green-500" });
      }
    } catch (error: any) {
      console.error("Error updating attendance:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update attendance." });
    }
  }, [selectedClassId, formattedSessionDate, currentUser, toast, facultyClasses, refreshAttendance]);





  const markAttendance = useCallback(async (studentIdentifier: string) => {
    if (!selectedClassId || !sessionActive || !currentUser) return;

    let student: User | undefined;
    const trimmedIdentifier = studentIdentifier.trim();
    if (studentMap.has(trimmedIdentifier)) {
      student = studentMap.get(trimmedIdentifier);
    } else {
      const foundStudent = enrolledStudents?.find(s => s.registrationNumber === trimmedIdentifier || s.id === trimmedIdentifier);
      student = foundStudent;
    }

    if (!student) {
      setLastScanResult({ status: 'not_found', message: `Student with identifier "${trimmedIdentifier}" not found in this class.` });
      toast({ variant: "destructive", title: "Student Not Found", description: "This student is not enrolled in the selected class." });
      return;
    }

    if (presentStudentIds.has(student.id)) {
      setLastScanResult({ status: 'already_marked', message: `${student.name} is already marked as present.` });
      toast({ title: "Already Marked", description: `${student.name} is already marked as present.` });
      return;
    }

    await setAttendanceStatus(student, 'Present');
    setLastScanResult({ status: 'success', message: `${student.name} has been marked present.` });

  }, [selectedClassId, sessionActive, enrolledStudents, presentStudentIds, toast, currentUser, studentMap, setAttendanceStatus]);

  const performFaceIdentification = useCallback(async () => {
    if (!selectedClassId || !sessionActive || !currentUser || !modelsLoaded) return;

    setLoadingFaceId(true);
    try {
      const video = document.querySelector('#reader video') as HTMLVideoElement;
      if (!video) throw new Error("Camera not active");

      // Extract numeric embedding using ML model
      const descriptor = await getFaceEmbedding(video);

      if (!descriptor) {
        throw new Error("No face detected. Please ensure the student is looking at the camera.");
      }

      const response = await fetch('/api/attendance/identify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId, descriptor }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Face identification failed");
      }

      const result = await response.json();
      if (result.studentId) {
        await markAttendance(result.studentId);
        toast({ title: "Face Identified", description: result.message, className: "bg-green-100 dark:bg-green-900 border-green-500" });
      } else {
        setLastScanResult({ status: 'not_found', message: result.message || "No matching student found." });
        toast({ variant: "destructive", title: "No Match", description: "Face does not match any enrolled student." });
      }
    } catch (error: any) {
      console.error("Face identification error:", error);
      toast({ variant: "destructive", title: "Identification Error", description: error.message });
    } finally {
      setLoadingFaceId(false);
    }
  }, [selectedClassId, sessionActive, currentUser, toast, modelsLoaded, markAttendance]);

  const handleEndSession = () => {
    setSessionActive(false);
    setSelectedClassId(null);
    setLastScanResult(null);
    toast({
      title: "Session Ended",
      description: "You can select a new class to start another session.",
    })
  };

  useEffect(() => {
    const readerElementId = 'reader';

    if (sessionActive && useScanner) {
      if (scannerState !== 'IDLE') return;

      setScannerState('INITIALIZING');
      const scanner = new Html5Qrcode(readerElementId, {
        verbose: false,
        formatsToSupport: scannerConfig.supportedScanTypes,
      });
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        markAttendance(decodedText);
        if (scannerRef.current?.isScanning) {
          try {
            scannerRef.current.pause(true);
            setTimeout(() => scannerRef.current?.resume(), 1500);
          } catch (e) { /* Ignore */ }
        }
      };

      scanner.start(
        { facingMode: 'environment' },
        scannerConfig,
        onScanSuccess,
        (errorMessage) => { /* ignore scan errors */ }
      ).then(() => {
        setScannerState('SCANNING');
      }).catch((err) => {
        setScannerState('ERROR');
        setUseScanner(false); // Fallback if camera fails
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: err.message || 'Could not start camera. Switched to manual mode.',
        });
      });
    } else {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          setScannerState('IDLE');
        }).catch(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          setScannerState('IDLE');
        });
      } else {
        setScannerState('IDLE');
      }
    }

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => { });
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [sessionActive, useScanner, markAttendance, scannerState]);


  const handleSubmitManual = () => {
    if (manualRegNumber) {
      markAttendance(manualRegNumber.trim());
      setManualRegNumber("");
    }
  };

  const isLoading = isLoadingClasses || isLoadingEnrolled || isLoadingAttendance;
  const selectedClassName = facultyClasses?.find(c => c.id === selectedClassId)?.name || "";

  const renderScannerOverlay = () => {
    if (!useScanner) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Scanner is disabled. Use manual entry below.</p>
        </div>
      )
    }

    if (isFaceMode && scannerState === 'SCANNING') {
      return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-primary rounded-full border-dashed animate-[spin_10s_linear_infinite] opacity-50"></div>
          <div className="absolute w-48 h-48 border-2 border-primary rounded-full flex items-center justify-center">
            <div className="w-full h-0.5 bg-primary/30 animate-pulse"></div>
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] py-0 px-2 border-primary/50 text-primary animate-pulse">
              ALIGN FACE WITHIN CIRCLE
            </Badge>
          </div>
        </div>
      )
    }

    switch (scannerState) {
      case 'IDLE':
        if (!sessionActive) {
          return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80">
              <QrCode className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Select a class to start</p>
            </div>
          );
        }
        return null;
      case 'INITIALIZING':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Starting camera...</p>
          </div>
        );
      case 'ERROR':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="mt-4 text-destructive">Camera permission denied. Please enable it in your browser settings.</p>
          </div>
        );
      case 'SCANNING':
        return null; // No overlay when scanning
    }
  }


  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Take Attendance</CardTitle>
            <CardDescription>Select a class and date to start an attendance session.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <Select onValueChange={handleClassSelection} disabled={isLoadingClasses} value={selectedClassId || ""}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select a class"} />
              </SelectTrigger>
              <SelectContent>
                {facultyClasses?.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.section}</SelectItem>)}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !sessionDate && "text-muted-foreground"
                  )}
                  disabled={!sessionActive}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? format(sessionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={setSessionDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
          {sessionActive && (
            <CardContent>
              <Button onClick={handleEndSession} variant="outline" className="w-full">
                End Session & Select New Class
              </Button>
            </CardContent>
          )}
        </Card>
        <Card className={cn(!sessionActive && "opacity-50 pointer-events-none")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
                  {isFaceMode
                    ? <UserIcon className="text-primary h-8 w-8" />
                    : <ScanLine className="h-8 w-8 text-primary" />}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {isFaceMode ? "Face ID Input" : "QR / Barcode Input"}
                  </span>
                </CardTitle>
                <CardDescription className="text-base mt-1 font-medium text-muted-foreground">
                  {isFaceMode ? "Align student's face for automatic identification." : "Scan student QR codes or manual entry."}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="face-mode" className="text-xs font-medium text-muted-foreground">Face ID</label>
                  <Switch id="face-mode" checked={isFaceMode} onCheckedChange={setIsFaceMode} />
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="scanner-toggle" className="text-xs font-medium text-muted-foreground">Camera</label>
                  <Switch id="scanner-toggle" checked={useScanner} onCheckedChange={setUseScanner} disabled={scannerState === 'ERROR'} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isFaceMode && useScanner && sessionActive && scannerState === 'SCANNING' && (
              <div className="mb-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full h-10 gap-2 border-primary/20 hover:border-primary"
                  onClick={performFaceIdentification}
                  disabled={loadingFaceId}
                >
                  {loadingFaceId ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserIcon className="h-4 w-4 text-primary" />}
                  {loadingFaceId ? "Identifying..." : "Scan & Identify Face"}
                </Button>
              </div>
            )}
            {useScanner && (
              <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center relative overflow-hidden mb-4">
                <div id="reader" className="w-full h-full" />
                {renderScannerOverlay()}
              </div>
            )}

            {useScanner && sessionActive && (
              <Button onClick={() => setUseScanner(false)} variant="destructive" className="w-full flex items-center gap-2 mb-4">
                <StopCircle />
                Stop Camera & Use Manual Entry
              </Button>
            )}

            {sessionActive && lastScanResult && (
              <Alert className="mt-4 border-primary/20 bg-primary/5" variant={lastScanResult.status === "success" ? "default" : "destructive"}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-full",
                      lastScanResult.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {lastScanResult.status === "success" ? <UserCheck className="h-6 w-6" /> : <UserX className="h-6 w-6" />}
                    </div>
                    <div>
                      <AlertTitle className="font-bold text-lg">
                        {lastScanResult.status === "success" ? "Student Identified" : "Recognition Failed"}
                      </AlertTitle>
                      <AlertDescription className="text-sm opacity-90">
                        {lastScanResult.message}
                      </AlertDescription>
                    </div>
                  </div>
                  {lastScanResult.status === "success" && lastScanResult.message.includes("%") && (
                    <div className="flex flex-col items-end gap-1">
                      <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm">
                        {lastScanResult.message.split("Accuracy: ")[1]} Match
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Biometric Verified</span>
                    </div>
                  )}
                </div>
              </Alert>
            )}

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
              <Input
                placeholder="Enter registration number manually"
                disabled={!sessionActive}
                value={manualRegNumber}
                onChange={e => setManualRegNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitManual()}
              />
              <Button onClick={handleSubmitManual} disabled={!sessionActive || !manualRegNumber} className="w-full sm:w-auto">Submit</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks /> Attendance Summary</CardTitle>
            <CardDescription>
              Summary for <strong>{selectedClassName || "No Class"}</strong> on <strong>{sessionDate ? format(sessionDate, "PPP") : 'No Date'}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4 p-4 bg-secondary rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{enrolledStudents?.length || 0}</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-500">{presentStudentIds.size}</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-500">{(enrolledStudents?.length || 0) - presentStudentIds.size}</p>
              </div>
            </div>

            <h3 className="font-semibold mb-2">Student List:</h3>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
              {isLoading && <p className="text-muted-foreground text-center p-4">Loading students...</p>}
              {!isLoading && enrolledStudents?.map((student) => {
                const isPresent = presentStudentIds.has(student.id);
                return (
                  <div key={student.id} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{student.name}</span>
                      {student.registrationNumber && <span className="text-[10px] text-muted-foreground">{student.registrationNumber}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs", isPresent ? "text-green-600" : "text-red-600")}>{isPresent ? "Present" : "Absent"}</span>
                      <Switch
                        checked={isPresent}
                        onCheckedChange={(checked) => setAttendanceStatus(student, checked ? 'Present' : 'Absent')}
                        aria-label={`Mark ${student.name} as ${isPresent ? 'absent' : 'present'}`}
                      />
                    </div>
                  </div>
                )
              })}
              {!isLoading && (!enrolledStudents || enrolledStudents.length === 0) && <p className="text-muted-foreground text-center text-sm p-4">No class selected or no students enrolled.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
