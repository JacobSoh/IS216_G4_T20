import { NextResponse } from 'next/server';

import { retrieveProfileById } from '@/services/profileService';

export async function GET(req, ctx) {
    const { id: oid } = await ctx.params
    try {
        const profile = await retrieveProfileById(oid);
        return NextResponse.json(
            {
                status: 200,
                record: profile
            },
            { status: 200 }
        )
    } catch (e) {
        return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
    }
}