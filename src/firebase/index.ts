import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, onSnapshot, doc, Query, DocumentReference } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { useState, useEffect, useMemo } from "react";
import { firebaseConfig } from "./config";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

export const useFirestore = () => firestore;
export const useStorage = () => storage;

// Custom Error Class
export class FirestorePermissionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FirestorePermissionError";
    }
}

// Simple Error Emitter
export const errorEmitter = {
    listeners: [] as ((err: any) => void)[],
    emit(err: any) {
        this.listeners.forEach(l => l(err));
    },
    on(listener: (err: any) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
};

export const useUser = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user from our own API since we are using JWT/MongoDB for Auth
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    // Map 'id' to 'uid' for compatibility with dashboard if it's missing
                    setUser({ ...data.user, uid: data.user.id || (data.user as any).uid });
                } else {
                    setUser(null);
                }
            })
            .catch(err => {
                console.error("Error fetching user in useUser:", err);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    return { user, loading };
};

export const useAuth = useUser;

export function useCollection<T>(query: Query | null) {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!query) {
            setData(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = onSnapshot(query,
            (snapshot) => {
                const docs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as T[];
                setData(docs);
                setIsLoading(false);
            },
            (err) => {
                console.error("Firestore useCollection error:", err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [query]);

    return { data, isLoading, error };
}

export function useDoc<T>(docRef: DocumentReference | null) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!docRef) {
            setData(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = onSnapshot(docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setData({ id: snapshot.id, ...snapshot.data() } as T);
                } else {
                    setData(null);
                }
                setIsLoading(false);
            },
            (err) => {
                console.error("Firestore useDoc error:", err);
                setError(err);
                setIsLoading(false);
                if (err.code === 'permission-denied') {
                    errorEmitter.emit(new FirestorePermissionError("You don't have permission to access this document."));
                }
            }
        );

        return () => unsubscribe();
    }, [docRef]);

    return { data, isLoading, error };
}

export const useMemoFirebase = (callback: () => any, deps: any[]) => {
    return useMemo(callback, deps);
};
