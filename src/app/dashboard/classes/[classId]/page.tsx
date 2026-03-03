'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Class, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MoreHorizontal, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AddStudentDialog } from './components/add-student-dialog';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditStudentDialog } from './components/edit-student-dialog';
import { RemoveStudentDialog } from './components/remove-student-dialog';

export default function ManageClassPage({ params }: { params: { classId: string } }) {
  const classId = params.classId as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [facultyData, setFacultyData] = useState<UserType | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<UserType[]>([]);
  const [allStudents, setAllStudents] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/classes/${classId}`);
        if (!response.ok) throw new Error('Failed to fetch class data');
        const data = await response.json();
        setClassData(data.class);
        setFacultyData(data.faculty);
        setEnrolledStudents(data.enrolledStudents);
        setAllStudents(data.allStudents);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  const unEnrolledStudents = allStudents.filter(
    (student) => !enrolledStudents.some((enrolled) => enrolled.id === student.id)
  );

  const handleEdit = (student: UserType) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleRemove = (student: UserType) => {
    setSelectedStudent(student);
    setIsRemoveDialogOpen(true);
  };

  return (
    <>
      {selectedStudent && (
        <>
          <EditStudentDialog
            student={selectedStudent}
            classId={classId}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
          <RemoveStudentDialog
            student={selectedStudent}
            classId={classId}
            open={isRemoveDialogOpen}
            onOpenChange={setIsRemoveDialogOpen}
          />
        </>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/classes" passHref>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            Manage Class
          </h1>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Enrolled Students</CardTitle>
                  <CardDescription>
                    View and manage students in this class.
                  </CardDescription>
                </div>
                <AddStudentDialog allStudents={unEnrolledStudents} classId={classId} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Registration No.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolledStudents && enrolledStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={student.avatarUrl} alt={student.name} />
                                <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.registrationNumber || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={student.status === 'Active' ? 'secondary' : 'destructive'}>
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(student)}>
                                  Edit Student
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleRemove(student)}>
                                  Remove from Class
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {(!isLoading && enrolledStudents?.length === 0) && (
                  <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                    <p>No students enrolled in this class yet.</p>
                    <p className="text-sm">Click "Enroll Student" to add students.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <Skeleton className="h-6 w-3/4" /> : <h2 className="text-xl font-semibold">{classData?.name}</h2>}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Section:</span>
                    {isLoading ? <Skeleton className="h-4 w-10" /> : <span className="font-medium">{classData?.section}</span>}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Students:</span>
                    {isLoading ? <Skeleton className="h-4 w-10" /> : <span className="font-medium">{enrolledStudents?.length || 0}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-muted-foreground flex items-center gap-2"><UserIcon className="h-4 w-4" /> Faculty:</span>
                    {isLoading ? <Skeleton className="h-4 w-24" /> : <span className="font-medium">{facultyData?.name}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
