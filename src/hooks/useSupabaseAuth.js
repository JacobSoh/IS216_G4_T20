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

    const LOGOUT_FLAG = 'app:isLoggingOut';

    // Instant, safe logout: optimistic UI + immediate redirect
    const logout = useCallback(async (options = {}) => {
        const { redirectTo } = options;

        // 1) Optimistic local state and guard across pages
        try {
            if (typeof window !== 'undefined') sessionStorage.setItem(LOGOUT_FLAG, '1');
        } catch {}
        setIsAuthed(false);

        // 2) Kick off sign-out in the background
        const signOutPromise = sbRef.current.auth.signOut().catch(() => {}).finally(() => {
            try { if (typeof window !== 'undefined') sessionStorage.removeItem(LOGOUT_FLAG); } catch {}
        });

        // 3) Redirect only if redirectTo is provided, otherwise just refresh
        try {
            if (redirectTo) {
                if (typeof window !== 'undefined') {
                    window.location.replace(redirectTo);
                    // After replace, code continues until navigation commits; no need to await
                } else {
                    router.replace(redirectTo);
                }
            } else {
                // Just refresh to update UI without changing page
                safeRefresh();
            }
        } catch {
            // As a fallback, refresh the router to re-render unauth state
            safeRefresh();
        }

        // Do not await signOut; return promise in case caller wants to
        return signOutPromise;
    }, [router, safeRefresh]);

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
