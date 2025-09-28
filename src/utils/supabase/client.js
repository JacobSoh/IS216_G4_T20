"use client";

import { createBrowserClient } from "@supabase/ssr";

let _sb = null;

export function supabaseBrowser() {
    if (!_sb) {
        _sb = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
    };
    return _sb;
};