'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/lib/types';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

interface RemoveStudentDialogProps {
  student: User;
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveStudentDialog({ student, classId, open, onOpenChange }: RemoveStudentDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleRemove = async () => {
    if (!classId || !student) return;

    setIsPending(true);
    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: student.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove student');
      }

      toast({
        title: 'Student Removed',
        description: `${student.name} has been removed from the class.`,
      });
      onOpenChange(false);

      // Refresh the page to update the student list
      window.location.reload();
    } catch (error: any) {
      console.error('Error removing student:', error);
      toast({
        variant: 'destructive',
        title: 'Removal Failed',
        description: error.message || 'Could not remove student.',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove <strong>{student?.name}</strong> from this class.
            This will not delete the student's account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin mr-2" />}
              Remove Student
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
