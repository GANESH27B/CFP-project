'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { User as UserType } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(3, 'Class name must be at least 3 characters.'),
  section: z.string().min(1, 'Section is required.'),
  facultyId: z.string().min(1, 'Please select a faculty member.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddClassDialogProps {
  faculty: UserType[];
}

export function AddClassDialog({ faculty }: AddClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      section: '',
      facultyId: faculty.length === 1 ? faculty[0].id : '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Could not create class.');
      }

      toast({
        title: 'Class Created',
        description: `The class "${values.name}" has been successfully created.`,
      });
      setOpen(false);
      form.reset();

      // Optionally trigger a refresh of the classes list if a callback is provided
      // or window.location.reload() for now to keep it simple and ensure data sync
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not create class.',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Enter the details for the new class and assign a faculty member.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Computer Science 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facultyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Faculty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={faculty.length === 1}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a faculty member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {faculty.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ({f.role.charAt(0).toUpperCase() + f.role.slice(1)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin mr-2" />}
                Create Class
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
