// middleware.js
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabase/server';
import { useAlert } from '@/context/AlertContext';

export async function middleware(req) {
    const res = NextResponse.next();
    const sb = supabaseServer();
    
    const { data: { session } } = await (await sb).auth.getSession();

    const { pathname, search } = req.nextUrl;
    
    const isAuthPage = pathname === '/login' || pathname === '/register';

    // Signed-in users shouldn't see auth pages
    if (session && isAuthPage) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    // Protect these sections
    const isProtected =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/account') ||
        pathname.startsWith('/sell');

    if (isProtected && !session) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/account/:path*', '/sell/:path*', '/login', '/register'],
};
