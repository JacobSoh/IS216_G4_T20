import { NextResponse } from 'next/server';
import { 
    deleteAuctionById,
    getAuctionById,
    updateAuctionById
} from '@/services/auctionService';

export async function GET(req, ctx) {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Please supply id of auction' }, { status: 400 })
    try {
        const auction = await getAuctionById(id);
        return NextResponse.json({
            status: 200,
            record: auction
        }, {status: 200});
    } catch (e) {
        return NextResponse.json({ status: 500, error: e.message }, {status: 500});
    };
};

export async function PUT(req, ctx) {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Please supply id of auction' }, { status: 400 })
    const body = await req.json();
    try {
        const auction = await updateAuctionById(body, id);
        return NextResponse.json({
            status: 200,
            record: auction
        }, {status: 200});
    } catch (e) {
        return NextResponse.json({ status: 500, error: e.message }, {status: 500});
    };
};

export async function DELETE(req, ctx) {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Please supply AID of auction' }, { status: 400 })
    const body = await req.json();
    try {
        const result = await deleteAuctionById(id, body.oid);
        return NextResponse.json({
            status: 200,
            success: result
        }, {status: 200});
    } catch (e) {
        console.log(e);
        return NextResponse.json({ status: 500, error: e.message }, {status: 500});
    };
};