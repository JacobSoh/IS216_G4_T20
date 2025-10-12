import { NextResponse } from 'next/server'
import { retrieveProfileById } from '@/services/profileService'

export async function GET(req, context) {
    try {
        const params = await context.params
        const userId = params.id

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        const profile = await retrieveProfileById(userId)

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        return NextResponse.json(
            {
                status: 200,
                record: profile
            },
            { status: 200 }
        )
    } catch (e) {
        console.error('[Profile API GET] Error:', e.message)
        return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
    }
}
