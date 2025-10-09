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

        const syncUser = async () => {
            try {
                const { data: { user }, error } = await sb.auth.getUser();
                if (cancelled) return lastAuthState;
                if (error && error.message?.includes('Auth session missing')) {
                    setIsAuthed(false);
                    return false;
                }
                if (error) throw error;
                const next = Boolean(user);
                setIsAuthed(next);
                return next;
            } catch (e) {
                if (!cancelled) {
                    setIsAuthed(false);
                }
                return false;
            }
        };

        syncUser().then((value) => {
            if (!cancelled) {
                lastAuthState = Boolean(value);
            }
        });

        const { data: { subscription } } = sb.auth.onAuthStateChange(async () => {
            const next = await syncUser();
            if (!cancelled && lastAuthState !== next) {
                lastAuthState = Boolean(next);
                router.refresh();
            }
        });

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, [initialAuthed, router]);

    return { isAuthed, logout };
}
