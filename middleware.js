// middleware.js
import { NextResponse } from 'next/server';

const SUPABASE_KEYS = [
    'code', 'type', 'error', 'error_description', 'provider', 'state'
];

export function middleware(req) {
    const url = req.nextUrl;
    const params = url.searchParams;

    // Only handle when Supabase sends something meaningful
    const hasAny = SUPABASE_KEYS.some(k => params.has(k));
    if (!hasAny) return NextResponse.next();

    // Map to a flash payload
    let flash = null;

    if (params.get('error')) {
        flash = {
            message: params.get('error_description') || params.get('error'),
            variant: 'error'
        };
    } else {
        const type = params.get('type');
        if (type === 'recovery') {
            flash = { message: 'Password updated. Please sign in again.', variant: 'success' };
        } else if (type === 'magiclink') {
            flash = { message: 'Magic link accepted. Welcome back!', variant: 'success' };
        } else {
            // signup / email_verification / etc.
            flash = { message: 'Email verified! You can log in now.', variant: 'success' };
        }
    }

    // Clean the URL
    const cleaned = url.clone();
    SUPABASE_KEYS.forEach(k => cleaned.searchParams.delete(k));

    const res = NextResponse.redirect(cleaned);

    // Short-lived cookie the client can read & clear
    res.cookies.set('flash', JSON.stringify(flash), {
        path: '/',
        httpOnly: false, // readable on the client
        sameSite: 'lax',
        maxAge: 60
    });

    return res;
}

// Only run on routes that might receive Supabase redirects (tweak as you like)
export const config = {
    matcher: ['/login', '/signin', '/auth/:path*']
};
