# **App Name**: AttendSync

## Core Features:

- User Management: Admin can add, edit, and delete faculty and student accounts.
- Class & Section Management: Admin can create and manage classes and sections, assigning students as needed.
- Attendance Tracking via QR/Barcode: Faculty can take attendance by scanning QR codes or barcodes using the device's camera. Includes sound feedback upon successful confirmation.
- Manual Attendance Input: Faculty can manually enter student registration numbers to mark attendance.
- Offline Attendance Storage: Store attendance data locally using IndexedDB or LocalForage when offline.
- Attendance Auto-Sync: Automatically synchronize attendance data between IndexedDB and MySQL when the device reconnects to the internet.
- Attendance Analytics and Reporting Tool: Generate class-wise, student-wise, and faculty-wise attendance reports and visualizations; and reason about what insights the reports can bring, providing additional relevant analysis, so instructors have an advanced decision making tool.

## Style Guidelines:

- Primary color: Deep Blue (#2E4765) for a professional and trustworthy feel.
- Background color: Light gray (#F0F4F8) for a clean, modern interface.
- Accent color: Teal (#39A9CB) for interactive elements and highlights.
- Body and headline font: 'Inter' sans-serif, for a modern and neutral look.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use consistent and professional icons from Material UI or Shadcn UI to represent different actions and data points.
- Subtle animations for transitions and feedback, such as attendance confirmation and data loading.