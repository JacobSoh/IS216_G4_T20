import { NextResponse } from 'next/server'

import { setActiveAuctionItem } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export async function PUT(req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Missing auction aid' }, { status: 400 })
  }
  const { iid, currentPrice } = await req.json()
  if (!iid) {
    return NextResponse.json({ error: 'Missing item id (iid)' }, { status: 400 })
  }
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await setActiveAuctionItem({
      aid,
      iid,
      actorId: user.id,
      currentPrice
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
