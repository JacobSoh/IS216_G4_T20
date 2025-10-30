// hooks/useSupabaseAuth.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useInitialAuthed } from '@/app/providers';

export function useSupabaseAuth(initialAuthedProp) {
    const initialFromCtx = useInitialAuthed();
    const initialAuthed = initialAuthedProp ?? initialFromCtx ?? false;

    const [isAuthed, setIsAuthed] = useState(initialAuthed);
    const [ready, setReady] = useState(false);

    const sbRef = useRef(null);
    const didInit = useRef(false);
    const lastAuth = useRef(!!initialAuthed);
    const lastRefreshAt = useRef(0);

    const router = useRouter();
    if (!sbRef.current) sbRef.current = supabaseBrowser();

    const safeRefresh = useCallback(() => {
        const now = Date.now();
        if (now - lastRefreshAt.current > 800) {
            lastRefreshAt.current = now;
            router.refresh();
        }
    }, [router]);

    const logout = useCallback(async () => {
        await sbRef.current.auth.signOut();
        setIsAuthed(false);
        safeRefresh();
    }, [safeRefresh]);

    useEffect(() => {
        let mounted = true;
        const sb = sbRef.current;

        // 1) Instant local read (no network)
        (async () => {
            const { data: { session } } = await sb.auth.getSession();
            if (!mounted) return;
            setIsAuthed(!!session?.user);
            setReady(true);

            // 2) Background verify (handles revoked tokens)
            try {
                const { data: { user } } = await sb.auth.getUser();
                if (!mounted) return;
                setIsAuthed(!!user);
            } catch { /* ignore */ }
        })();

        // 3) Live updates, debounced refresh
        const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
            const next = !!session?.user;

            if (!didInit.current) {
                didInit.current = true;
                lastAuth.current = next;
                setIsAuthed(next);
                return;
            }

            if (lastAuth.current !== next) {
                lastAuth.current = next;
                setIsAuthed(next);
                safeRefresh();
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, [safeRefresh]);

    return { isAuthed, ready, logout };
}
