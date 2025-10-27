import { NextResponse } from 'next/server'

import { adjustAuctionTimer } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export async function POST(req, ctx) {
  const { id: aid } = await ctx.params
  const user = await getServerUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { durationSeconds } = await req.json()

    if (durationSeconds === undefined || durationSeconds === null) {
      return NextResponse.json(
        { error: 'Missing durationSeconds parameter' },
        { status: 400 }
      )
    }

    const result = await adjustAuctionTimer({
      aid,
      durationSeconds,
      actorId: user.id
    })

    return NextResponse.json({
      status: 200,
      record: result
    })
  } catch (error) {
    console.error('Error adjusting timer:', error)
    return NextResponse.json(
      {
        status: 500,
        error: error.message ?? 'Unable to adjust timer'
      },
      { status: 500 }
    )
  }
}
