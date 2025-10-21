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
    
    const isProtected = false;
        // pathname.startsWith('/profile') ||
        // pathname.startsWith('/auction');

    if (isProtected && !isAuthed) {
        const loginUrl = new URL('/', req.url);
        return NextResponse.redirect(loginUrl, {status: 302});
    }

    return res;
}

export const config = {
    matcher: [
        '/auction/:path*',
        '/profile/:path*'
    ],
};
