import { NextResponse } from 'next/server'

import { getAuctionChatMessages, postAuctionChatMessage } from '@/services/auctionService'
import { getServerUser } from '@/utils/auth'

export async function GET(req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Missing auction aid' }, { status: 400 })
  }
  const { searchParams } = new URL(req.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Number(limitParam) : 120
  try {
    const messages = await getAuctionChatMessages(aid, { limit })
    return NextResponse.json({ record: messages }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error?.message ?? 'Unable to load chat' }, { status: 500 })
  }
}

export async function POST(req, ctx) {
  const { id: aid } = await ctx.params
  if (!aid) {
    return NextResponse.json({ error: 'Missing auction aid' }, { status: 400 })
  }
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { message } = body ?? {}
    const record = await postAuctionChatMessage({ aid, uid: user.id, message })
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error?.message ?? 'Unable to send message' }, { status: 500 })
  }
}
