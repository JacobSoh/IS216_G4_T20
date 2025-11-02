import { NextResponse } from 'next/server';

import { updateProfileByID } from '@/services/profileService';
import { getProfileById } from '@/repositories/profileRepo';
import { getServerUser } from '@/utils/auth';

export async function GET(req) {
    try {
        const user = await getServerUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const profile = await getProfileById(user.id);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        return NextResponse.json(
            {
                status: 200,
                record: {
                    id: profile.id,
                    username: profile.username,
                    wallet_balance: profile.wallet_balance,
                    verified: profile.verified
                }
            },
            { status: 200 }
        )
    } catch (e) {
        return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
    }
}

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
