import { NextResponse } from 'next/server';

import { updateProfileByID } from '@/services/profileService';

export async function UPDATE(req) {
    const { data } = await req.json()
    try {
        const profile = await updateProfileByID(data);
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
