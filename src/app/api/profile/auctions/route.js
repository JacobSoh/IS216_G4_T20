import { NextResponse } from 'next/server'

import { getAuctionSummariesByOwner } from '@/services/auctionService'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const seller = searchParams.get('seller')

  if (!seller) {
    return NextResponse.json(
      { status: 400, error: 'Missing seller parameter.' },
      { status: 400 }
    )
  }

  try {
    const summaries = await getAuctionSummariesByOwner(seller)
    return NextResponse.json(
      {
        status: 200,
        record: summaries
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Failed to load auction summaries', error)
    return NextResponse.json(
      { status: 500, error: error?.message ?? 'Failed to load auctions.' },
      { status: 500 }
    )
  }
}
