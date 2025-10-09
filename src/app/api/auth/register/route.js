import { NextResponse } from 'next/server'

import { register } from '@/services/userService'

export async function POST(req) {
  const { email, password, username, redirectTo, profile, metadata } = await req.json()
  try {
    const result = await register({
      email,
      password,
      username,
      redirectTo,
      profile,
      metadata
    })
    return NextResponse.json(
      {
        status: 200,
        record: result
      },
      { status: 200 }
    )
  } catch (e) {
    console.error('[api/auth/register] failed', e)
    return NextResponse.json(
      {
        status: 500,
        error: e?.message ?? 'Unable to register',
        detail: e?.cause ?? null
      },
      { status: 500 }
    )
  }
}
