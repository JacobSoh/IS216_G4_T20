import { NextResponse } from 'next/server'

import { getAllAuctions, getAuctionsByOwner, setAuction, deleteAuctionById } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const seller = searchParams.get('seller') || searchParams.get('oid')
    const auctions = seller ? await getAuctionsByOwner(seller) : await getAllAuctions();
    return NextResponse.json(
      {
        status: 200,
        record: auctions
      },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  const body = await req.json()
  try {
    const auction = await setAuction(body)
    return NextResponse.json(
      {
        status: 200,
        record: auction
      },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ status: 401, error: 'Unauthorized' }, { status: 401 })
    }
    const { aid } = await req.json()
    if (!aid) {
      return NextResponse.json({ status: 400, error: 'Missing auction id (aid)' }, { status: 400 })
    }
    await deleteAuctionById(aid, user.id)
    return NextResponse.json({ status: 200, success: true }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}
