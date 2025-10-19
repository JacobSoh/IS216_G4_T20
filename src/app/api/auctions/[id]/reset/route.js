import { NextResponse } from 'next/server'

import { resetAuctionState } from '@/services/auctionResetService'
import { getServerUser } from '@/utils/auth'

export async function POST(_req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Missing auction aid' }, { status: 400 })
  }

  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await resetAuctionState({
      aid,
      actorId: user.id
    })

    return NextResponse.json(
      {
        status: 200,
        record: result
      },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}
