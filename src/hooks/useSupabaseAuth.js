// hooks/useSupabaseAuth.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

    if (!sbRef.current) sbRef.current = supabaseBrowser();

    const safeRefresh = useCallback(() => {
        const now = Date.now();
        if (now - lastRefreshAt.current > 800) {
            lastRefreshAt.current = now;
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        }
    }, []);

    const LOGOUT_FLAG = 'app:isLoggingOut';

    // Instant, safe logout: optimistic UI + immediate redirect
    const logout = useCallback(async (options = {}) => {
        // Default to redirecting home after logout to avoid rendering protected pages unauthed
        const { redirectTo = '/' } = options;

        // 1) Optimistic local state and guard across pages
        try {
            if (typeof window !== 'undefined') sessionStorage.setItem(LOGOUT_FLAG, '1');
        } catch {}
        setIsAuthed(false);

        // 2) Kick off sign-out in the background
        const signOutPromise = sbRef.current.auth.signOut().catch(() => {}).finally(() => {
            try { if (typeof window !== 'undefined') sessionStorage.removeItem(LOGOUT_FLAG); } catch {}
        });

        // 3) Redirect to target (default '/') to prevent protected route from rendering with null user
        try {
            if (typeof window !== 'undefined') {
                window.location.href = redirectTo;
            }
        } catch {
            // As a fallback, refresh
            safeRefresh();
        }

        // Do not await signOut; return promise in case caller wants to
        return signOutPromise;
    }, [safeRefresh]);

    useEffect(() => {
        let mounted = true;
        const sb = sbRef.current;

        // If a logout is in progress (from another page), keep UI logged out immediately
        const isLoggingOut = typeof window !== 'undefined' && (() => {
            try { return sessionStorage.getItem(LOGOUT_FLAG) === '1'; } catch { return false; }
        })();

        // 1) Instant local read (no network)
        (async () => {
            const { data: { session } } = await sb.auth.getSession();
            if (!mounted) return;
            // Respect logout-in-progress flag to avoid flash of authed UI
            setIsAuthed(isLoggingOut ? false : !!session?.user);
            setReady(true);

            // 2) Background verify (handles revoked tokens)
            try {
                const { data: { user } } = await sb.auth.getUser();
                if (!mounted) return;
                setIsAuthed(isLoggingOut ? false : !!user);
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
