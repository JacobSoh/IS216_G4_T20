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
    const router = useRouter();
    if (!sbRef.current) sbRef.current = supabaseBrowser();

    const logout = useCallback(async () => {
        await sbRef.current.auth.signOut();
        setIsAuthed(false);
        router.refresh();
    }, [router]);

    useEffect(() => {
        let mounted = true;
        const sb = sbRef.current;

        // Instant local read
        (async () => {
            const { data: { session } } = await sb.auth.getSession();
            if (!mounted) return;
            setIsAuthed(!!session?.user);
            setReady(true);

            // Background verify
            try {
                const { data: { user } } = await sb.auth.getUser();
                if (!mounted) return;
                setIsAuthed(!!user);
            } catch { }
        })();

        const { data: { subscription } } =
            sb.auth.onAuthStateChange((_evt, session) => {
                if (!mounted) return;
                setIsAuthed(!!session?.user);
                router.refresh();
            });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, [router]);

    return { isAuthed, ready, logout };
}
