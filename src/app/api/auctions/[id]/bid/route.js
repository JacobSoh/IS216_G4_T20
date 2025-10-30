import { NextResponse } from 'next/server'

import { placeBidForItem } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export async function POST(req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Missing auction aid' }, { status: 400 })
  }
  const body = await req.json()
  const { iid, amount } = body ?? {}
  if (!iid || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Please supply iid and numeric amount' }, { status: 400 })
  }
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const bid = await placeBidForItem({
      aid,
      iid,
      bidderId: user.id,
      amount
    })
    return NextResponse.json(
      {
        status: 200,
        record: bid
      },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}
