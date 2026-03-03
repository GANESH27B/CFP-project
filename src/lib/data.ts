import { User, Class, AttendanceRecord, StudentAttendance } from "@/lib/types";

export const mockUsers: User[] = [
  { id: "USR001", name: "Admin User", email: "admin@example.com", role: "admin", avatarUrl: "https://picsum.photos/seed/101/40/40", status: "Active" },
  { id: "USR002", name: "Dr. Evelyn Reed", email: "evelyn.reed@example.com", role: "faculty", avatarUrl: "https://picsum.photos/seed/201/40/40", status: "Active" },
  { id: "USR003", name: "John Doe", email: "john.doe@example.com", role: "student", avatarUrl: "https://picsum.photos/seed/102/40/40", status: "Active", registrationNumber: "S001" },
  { id: "USR004", name: "Jane Smith", email: "jane.smith@example.com", role: "student", avatarUrl: "https://picsum.photos/seed/103/40/40", status: "Active", registrationNumber: "S002" },
  { id: "USR005", name: "Prof. Alan Turing", email: "alan.turing@example.com", role: "faculty", avatarUrl: "https://picsum.photos/seed/202/40/40", status: "Active" },
  { id: "USR006", name: "Peter Pan", email: "peter.pan@example.com", role: "student", avatarUrl: "https://picsum.photos/seed/104/40/40", status: "Inactive", registrationNumber: "S003" },
];

export const mockClasses: Omit<Class, 'facultyId'>[] = [
  { id: "CLS01", name: "Computer Science 101", section: "A" },
  { id: "CLS02", name: "Advanced Mathematics", section: "B" },
  { id: "CLS03", name: "History of Art", section: "A" },
  { id: "CLS04", name: "Quantum Physics", section: "C" },
];

export const mockAttendanceRecords: AttendanceRecord[] = [
    { id: "ATT001", studentName: "John Doe", studentId: "S001", date: "2024-05-20", status: "Present" },
    { id: "ATT002", studentName: "Jane Smith", studentId: "S002", date: "2024-05-20", status: "Present" },
    { id: "ATT003", studentName: "Peter Pan", studentId: "S003", date: "2024-05-20", status: "Absent" },
];

export const mockStudentAttendance: StudentAttendance[] = [
    { subject: "Computer Science 101", totalClasses: 20, attendedClasses: 18, percentage: 90 },
    { subject: "Advanced Mathematics", totalClasses: 20, attendedClasses: 15, percentage: 75 },
    { subject: "History of Art", totalClasses: 15, attendedClasses: 14, percentage: 93.3 },
    { subject: "Quantum Physics", totalClasses: 18, attendedClasses: 17, percentage: 94.4 },
];

export const classAttendanceData = [
  { name: 'CS 101', attendance: 92, fill: "var(--color-cs101)" },
  { name: 'Math 203', attendance: 85, fill: "var(--color-math203)" },
  { name: 'Art 100', attendance: 95, fill: "var(--color-art100)" },
  { name: 'Phys 301', attendance: 88, fill: "var(--color-phys301)" },
  { name: 'Eng 210', attendance: 78, fill: "var(--color-eng210)" },
];

export const overallAttendanceData = [
  { date: 'Jan', attendance: 80 },
  { date: 'Feb', attendance: 82 },
  { date: 'Mar', attendance: 78 },
  { date: 'Apr', attendance: 85 },
  { date: 'May', attendance: 90 },
  { date: 'Jun', attendance: 88 },
];
