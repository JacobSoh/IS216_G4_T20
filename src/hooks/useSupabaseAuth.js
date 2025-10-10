'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Global Supabase auth state manager
 * Syncs `isAuthed` with session and handles onAuthStateChange
 */
export function useSupabaseAuth(initialAuthed = false) {
    const [isAuthed, setIsAuthed] = useState(Boolean(initialAuthed));
    const sbRef = useRef(null);
    const router = useRouter();

    if (!sbRef.current) sbRef.current = supabaseBrowser();

    const logout = useCallback(async () => {
        await sbRef.current.auth.signOut();
        setIsAuthed(false);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const sb = sbRef.current;
        let lastAuthState = Boolean(initialAuthed);

        // Initial session check
        sb.auth.getSession().then(({ data: { session } }) => {
            if (cancelled) return;
            const next = !!session;
            setIsAuthed(next);
            lastAuthState = next;
        });

        // Auth state listener
        const { data: { subscription } } = sb.auth.onAuthStateChange((evt, session) => {
            const next = !!session;
            setIsAuthed(next);

            if ((evt === 'SIGNED_IN' || evt === 'SIGNED_OUT') && lastAuthState !== next) {
                lastAuthState = next;
                router.refresh(); // sync server components
            }
        });

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, [initialAuthed, router]);

    return { isAuthed, logout };
}
