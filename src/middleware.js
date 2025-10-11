// middleware.js
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabase/server';

export async function middleware(req) {
    const res = NextResponse.next();
    const sb = await supabaseServer();

    const { data: { user }, error } = await sb.auth.getUser();
    if (error && !error.message?.includes('Auth session missing')) {
        console.error('Supabase auth error in middleware:', error);
    };

    const isAuthed = Boolean(user);
    const { pathname } = req.nextUrl;

    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthed && isAuthPage) {
        return NextResponse.redirect(new URL('/', req.url));
    };

    const set = (k, v, maxAge = 10) =>
        res.cookies.set(k, String(v), {
        path: '/',
        maxAge,               // seconds
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        });

    const isProtected =
        pathname.startsWith('/auction') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/account') ||
        pathname.startsWith('/sell');

    if (isProtected && !isAuthed) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return res;
}

export const config = {
    matcher: ['/auction/:path*','/dashboard/:path*', '/account/:path*', '/sell/:path*'],
};
