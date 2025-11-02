import { NextResponse } from 'next/server'

import { placeBidForItem } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'
import { getProfileById } from '@/repositories/profileRepo'

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
    // Check wallet balance before placing bid
    const profile = await getProfileById(user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const walletBalance = Number(profile.wallet_balance ?? 0)

    if (walletBalance < amount) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You have $${walletBalance.toFixed(2)} but need $${amount.toFixed(2)}. Please top up your wallet.`
      }, { status: 400 })
    }

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
