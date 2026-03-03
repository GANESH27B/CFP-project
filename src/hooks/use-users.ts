import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';

export function useUsers(role?: UserRole) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const url = role ? `/api/users?role=${role}` : '/api/users';
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const data = await response.json();
                if (isMounted) {
                    setUsers(data.users || []);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchUsers();
        return () => {
            isMounted = false;
        };
    }, [role]);

    return { users, isLoading, error };
}
