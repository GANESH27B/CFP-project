import { useState, useEffect } from 'react';
import type { AttendanceRecord } from '@/lib/types';

export function useAttendance(filters?: { classId?: string; date?: string; studentId?: string; facultyId?: string }) {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAttendance = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filters?.classId) params.append('classId', filters.classId);
            if (filters?.date) params.append('date', filters.date);
            if (filters?.studentId) params.append('studentId', filters.studentId);
            if (filters?.facultyId) params.append('facultyId', filters.facultyId);

            const url = `/api/attendance${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch attendance');
            }
            const data = await response.json();
            setAttendance(data.records || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [JSON.stringify(filters)]);

    return { attendance, isLoading, error, refresh: fetchAttendance };
}
