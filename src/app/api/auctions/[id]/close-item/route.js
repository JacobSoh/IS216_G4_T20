import { NextResponse } from 'next/server'

import { closeItemSale } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export async function POST(req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Missing auction aid' }, { status: 400 })
  }

  const body = await req.json()
  const { iid } = body ?? {}
  if (!iid) {
    return NextResponse.json({ error: 'Missing item id (iid)' }, { status: 400 })
  }

  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await closeItemSale({
      aid,
      iid,
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
