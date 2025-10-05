import { NextResponse } from 'next/server';
import { 
    register
} from '@/services/userService';

export async function POST(req) {
    const { email, password, options } = await req.json();
    try {
        const result = await register(email, password, options);
        return NextResponse.json({
            status: 200,
            record: result
        }, {status: 200});
    } catch (e) {
        return NextResponse.json({ status: 500, error: e.message }, {status: 500});
    };
};