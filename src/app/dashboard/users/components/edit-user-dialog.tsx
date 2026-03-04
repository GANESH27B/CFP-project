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
import { Loader2, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    role: z.enum(['student', 'faculty', 'admin']),
    status: z.enum(['Active', 'Inactive']),
    registrationNumber: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedUser: User) => void;
}

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
    const [isPending, setIsPending] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
            status: user.status,
            registrationNumber: user.registrationNumber ?? '',
        },
    });

    // Reset form values whenever the user changes
    useEffect(() => {
        form.reset({
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
            status: user.status,
            registrationNumber: user.registrationNumber ?? '',
        });
    }, [user, form]);

    const watchedRole = form.watch('role');
    const watchedStatus = form.watch('status');

    const onSubmit = async (values: FormValues) => {
        setIsPending(true);
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: values.name,
                    email: values.email,
                    role: values.role,
                    status: values.status,
                    registrationNumber: values.role === 'student' ? (values.registrationNumber || undefined) : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Could not update the user.');
            }

            toast({
                title: 'User Updated',
                description: `${values.name}'s account has been updated successfully.`,
            });

            onSuccess({
                ...user,
                name: values.name,
                email: values.email,
                role: values.role as UserRole,
                status: values.status,
                registrationNumber: values.role === 'student' ? values.registrationNumber : undefined,
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message || 'Could not update the user.',
            });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-primary" />
                        Edit User
                    </DialogTitle>
                    <DialogDescription>
                        Update the account information for <span className="font-semibold">{user.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="name@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Role */}
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="flex flex-wrap gap-4"
                                        >
                                            {(['student', 'faculty', 'admin'] as const).map((r) => (
                                                <FormItem key={r} className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value={r} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal capitalize">{r}</FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Registration Number — only for students */}
                        {watchedRole === 'student' && (
                            <FormField
                                control={form.control}
                                name="registrationNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registration / Roll Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="STU123456" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Status toggle */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-3 rounded-lg border p-3">
                                        <Switch
                                            id="status-switch"
                                            checked={field.value === 'Active'}
                                            onCheckedChange={(checked) =>
                                                field.onChange(checked ? 'Active' : 'Inactive')
                                            }
                                        />
                                        <div className="flex flex-col">
                                            <Label htmlFor="status-switch" className="text-sm font-medium">
                                                Account Status
                                            </Label>
                                            <span className="text-xs text-muted-foreground">
                                                Currently{' '}
                                                <span
                                                    className={
                                                        watchedStatus === 'Active'
                                                            ? 'text-green-600 font-semibold'
                                                            : 'text-destructive font-semibold'
                                                    }
                                                >
                                                    {watchedStatus}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-2">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
