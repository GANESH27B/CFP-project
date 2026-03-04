export type UserRole = "admin" | "faculty" | "student";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  status: "Active" | "Inactive";
  registrationNumber?: string;
  faceDescriptor?: string | number[] | true; // `true` used as a lightweight enrollment-status flag in API list responses
  classId?: string; // This represents enrollment in a specific class instance for a term, not the general course.
  studentId?: string; // Explicitly added for querying enrollments
};

export type Class = {
  id: string;
  name: string;
  facultyId: string;
  section: string;
  studentIds: string[]; // Array of student UIDs enrolled in the class
};

export type AttendanceRecord = {
  id: string;
  studentName?: string; // Made optional as it might not be on every record
  studentId: string;
  classId: string;
  className?: string; // Denormalized for easier display in student's portal
  facultyId: string;
  date: string;
  status: "Present" | "Absent";
};

export type StudentAttendance = {
  subject: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
};


