'use client';

import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import getAuctionMetrics from './getAuctionMetrics.js';

export default function Analytics({ user }) {
    const sb = supabaseBrowser();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSellerAuctionData();
        const channel = sb
            .channel('items_sold_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'items_sold'
                },
                (payload) => {
                    fetchSellerAuctionData();
                }
            )
            .subscribe();

        return () => {
            sb.removeChannel(channel);
        };
    }, []);

    const fetchSellerAuctionData = async () => {
        try {
            setLoading(true);

            const { data: { user } } = await sb.auth.getUser();
            if (!user) return;
            const { data: auctions, error: auctionError } = await sb
                .from('auction')
                .select('*')
                .eq('oid', user.id);

            if (auctionError) throw auctionError;
            const auctionMetrics = await getAuctionMetrics(auctions, sb);
            setRows(auctionMetrics);
        } catch (error) {
            console.error('Error fetching auction data:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: 'auctionName', headerName: 'Auction Name', width: 150 },
        { field: 'status', headerName: 'Status', width: 130 },
        { field: 'startTime', headerName: 'Start Time', width: 180 },
        { field: 'totalItems', headerName: 'Total Items', width: 120, type: 'number' },
        { field: 'itemsSold', headerName: 'Items Sold', width: 120, type: 'number' },
        { field: 'itemsRemaining', headerName: 'Items Remaining', width: 150, type: 'number' },
        { field: 'totalRevenue', headerName: 'Total Revenue ($)', width: 160, type: 'number', valueFormatter: (value) => value != null ? `$${value.toFixed(2)}` : '$0.00' },
        { field: 'avgSalePrice', headerName: 'Avg Sale Price ($)', width: 160, type: 'number', valueFormatter: (value) => value != null ? `$${value.toFixed(2)}` : '$0.00' },
        { field: 'potentialRevenue', headerName: 'Potential Revenue ($)', width: 180, type: 'number', valueFormatter: (value) => value != null ? `$${value.toFixed(2)}` : '$0.00' },
        { field: 'uniqueBidders', headerName: 'Unique Bidders', width: 140, type: 'number' },
        { field: 'totalBids', headerName: 'Total Bids', width: 120, type: 'number' },
        { field: 'conversionRate', headerName: 'Conversion Rate (%)', width: 170, type: 'number', valueFormatter: (value) => value != null ? `${value}%` : '0%' },
        { field: 'timeInterval', headerName: 'Time Interval (s)', width: 150, type: 'number' }
    ];

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                showToolbar
            />
        </div>
    );
}
