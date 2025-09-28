import { NextResponse } from 'next/server';
import { 
    getAllAuctions,
    setAuction
} from '@/services/auctionService';

export async function GET(req) {
    try {
        const auctions = await getAllAuctions();
        return NextResponse.json({
            status: 200,
            record: auctions
        }, {status: 200});
    } catch (e) {
        return NextResponse.json({ status: 500, error: e.message }, {status: 500});
    };
};

export async function POST(req) {
    const body = await req.json();
    try {
        const auction = await setAuction(body);
        return NextResponse.json({
            status: 200,
            record: auction
        }, {status: 200});
    } catch (e) {
        return NextResponse.json({ status: 500, error: e.message }, {status: 500});
    };
};