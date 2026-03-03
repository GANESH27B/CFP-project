'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/lib/types';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  registrationNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditStudentDialogProps {
  student: User;
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStudentDialog({ student, classId, open, onOpenChange }: EditStudentDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student.name,
      registrationNumber: student.registrationNumber || '',
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        registrationNumber: student.registrationNumber || '',
      });
    }
  }, [student, form]);

  const onSubmit = async (values: FormValues) => {
    if (!firestore || !student) return;

    setIsPending(true);
    try {
        const batch = writeBatch(firestore);
        
        const updates: Partial<User> = {
            name: values.name,
            registrationNumber: values.registrationNumber,
        };

        // Update main user profile
        const userDocRef = doc(firestore, 'users', student.id);
        batch.update(userDocRef, updates);

        // Update enrolled student record
        const studentInClassRef = doc(firestore, `classes/${classId}/students`, student.id);
        batch.update(studentInClassRef, updates);
        
        await batch.commit();

        toast({
            title: 'Student Updated',
            description: `${values.name}'s information has been updated.`,
        });
        onOpenChange(false);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `users/${student.id} & classes/${classId}/students/${student.id}`,
                operation: 'update',
                requestResourceData: values,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update student details.',
            });
        }
    } finally {
        setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the details for {student.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
