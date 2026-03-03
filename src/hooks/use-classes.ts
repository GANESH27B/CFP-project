import { useState, useEffect } from 'react';
import type { Class } from '@/lib/types';

export function useClasses() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClasses = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/classes');
            if (!response.ok) {
                throw new Error('Failed to fetch classes');
            }
            const data = await response.json();
            setClasses(data.classes || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    return { classes, isLoading, error, refresh: fetchClasses };
}
