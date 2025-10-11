import { NextResponse } from 'next/server'

import { getAuctionLiveState } from '@/services/auctionService'

export async function GET(_req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Missing auction aid' }, { status: 400 })
  }
  try {
    const snapshot = await getAuctionLiveState(aid)
    return NextResponse.json(
      {
        status: 200,
        record: snapshot
      },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}
