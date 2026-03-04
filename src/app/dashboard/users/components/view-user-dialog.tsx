'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';
import { Mail, IdCard, ShieldCheck, UserIcon, Hash } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ViewUserDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value ?? '—'}</p>
            </div>
        </div>
    );
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    faculty: 'secondary',
    student: 'outline',
};

export function ViewUserDialog({ user, open, onOpenChange }: ViewUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        User Profile
                    </DialogTitle>
                </DialogHeader>

                {/* Avatar + name banner */}
                <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 p-5">
                    <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-2xl font-bold">
                            {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-center space-y-1">
                        <p className="text-lg font-semibold">{user.name}</p>
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant={roleBadgeVariant[user.role] ?? 'outline'} className="capitalize">
                                {user.role}
                            </Badge>
                            <Badge variant={user.status === 'Active' ? 'secondary' : 'destructive'}>
                                {user.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3 py-1">
                    <InfoRow icon={Mail} label="Email Address" value={user.email} />
                    {user.registrationNumber && (
                        <InfoRow icon={Hash} label="Registration / Roll Number" value={user.registrationNumber} />
                    )}
                    <InfoRow icon={IdCard} label="System ID" value={<span className="font-mono text-xs">{user.id}</span>} />
                    <InfoRow
                        icon={ShieldCheck}
                        label="Face Biometric"
                        value={
                            user.faceDescriptor ? (
                                <span className="text-green-600 font-semibold">Enrolled ✓</span>
                            ) : (
                                <span className="text-muted-foreground">Not enrolled</span>
                            )
                        }
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
