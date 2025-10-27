// middleware.js
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req) {
    // Clean auth callback params and set session before any render
    const url = req.nextUrl;
    const code = url.searchParams.get('code');
    const authError = url.searchParams.get('error');
    const authErrorDesc = url.searchParams.get('error_description');
    if (code || authError || authErrorDesc) {
        const cleanUrl = new URL(url.href);
        cleanUrl.searchParams.delete('code');
        cleanUrl.searchParams.delete('error');
        cleanUrl.searchParams.delete('error_description');

        // Use a redirect response so we can attach cookies
        const res = NextResponse.redirect(cleanUrl);

        // Bind Supabase to req/res cookies so it can set the session
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return req.cookies.get(name)?.value;
                    },
                    set(name, value, options) {
                        res.cookies.set(name, value, options);
                    },
                    remove(name, options) {
                        res.cookies.set(name, '', { ...options, maxAge: 0 });
                    },
                },
            }
        );

        try {
            if (code) {
                const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
                console.log(exErr);
                // Flash cookie for client toast
                res.cookies.set('email_verified_toast', '1', {
                    path: '/',
                    maxAge: 60,
                });
            }
        } catch {}

        return res;
    }

    const res = NextResponse.next();
    const sb = await supabaseServer();

    const { data: { user }, error } = await sb.auth.getUser();
    if (error && !error.message?.includes('Auth session missing')) {
        console.error('Supabase auth error in middleware:', error);
    };

    const isAuthed = Boolean(user);
    const { pathname, search } = req.nextUrl;

    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthed && isAuthPage) {
        return NextResponse.redirect(new URL('/', req.url));
    };
    
    const isProtected = 
        pathname.startsWith('/profile') ||
        pathname.startsWith('/auction');

    if (isProtected && !isAuthed) {
        const loginUrl = new URL('/', req.url);
        loginUrl.searchParams.set('login', '1');
        const nextPath = `${pathname}${search ?? ''}`;
        loginUrl.searchParams.set('next', nextPath);
        return NextResponse.redirect(loginUrl, {status: 302});
    }

    return res;
}

export const config = {
    matcher: [
        '/',
        '/auction/:path*',
        '/profile/:path*'
    ],
};
