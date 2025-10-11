import { NextResponse } from 'next/server'

import {
  deleteAuctionById,
  getAuctionById,
  updateAuctionById
} from '@/services/auctionService'

export async function GET(_req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Please supply auction aid' }, { status: 400 })
  }
  try {
    const auction = await getAuctionById(aid)
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

export async function PUT(req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Please supply auction aid' }, { status: 400 })
  }
  const body = await req.json()
  try {
    const auction = await updateAuctionById(body, aid)
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

export async function DELETE(req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Please supply auction aid' }, { status: 400 })
  }
  const body = await req.json()
  try {
    const result = await deleteAuctionById(aid, body?.oid)
    return NextResponse.json(
      {
        status: 200,
        success: result
      },
      { status: 200 }
    )
  } catch (e) {
    return NextResponse.json({ status: 500, error: e.message }, { status: 500 })
  }
}
