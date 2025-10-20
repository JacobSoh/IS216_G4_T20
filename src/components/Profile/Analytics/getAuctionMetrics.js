export default async function getAuctionMetrics(auctions, sb) {
    const auctionMetrics = await Promise.all(
        auctions.map(async (auction) => {
            const { data: items } = await sb
                .from('item')
                .select('iid, sold, min_bid')
                .eq('aid', auction.aid);

            const { data: soldItems } = await sb
                .from('items_sold')
                .select('final_price, buyer_id, iid')
                .eq('aid', auction.aid);

            const { data: bids } = await sb
                .from('bid_history')
                .select('uid, bid_amount')
                .eq('aid', auction.aid);

            const unsoldItemIds = items?.filter(item => !item.sold).map(item => item.iid) || [];

            let currentBids = [];
            if (unsoldItemIds.length > 0) {
                const { data: currentBidsData } = await sb
                    .from('current_bid')
                    .select('current_price, iid')
                    .eq('aid', auction.aid)
                    .in('iid', unsoldItemIds);
                currentBids = currentBidsData || [];
            }

            const totalItems = items?.length || 0;
            const itemsSold = soldItems?.length || 0;
            const itemsRemaining = totalItems - itemsSold;
            const totalRevenue = soldItems?.reduce((sum, item) => sum + parseFloat(item.final_price), 0) || 0;
            const avgSalePrice = itemsSold > 0 ? totalRevenue / itemsSold : 0;
            const uniqueBidders = new Set(bids?.map(bid => bid.uid)).size;
            const totalBids = bids?.length || 0;
            const conversionRate = totalItems > 0 ? (itemsSold / totalItems) * 100 : 0;

            let status = 'Upcoming';
            const now = new Date();
            const startTime = new Date(auction.start_time);

            if (startTime <= now) {
                if (totalItems === 0) {
                    status = 'Active (No Items)';
                } else if (itemsSold === totalItems) {
                    status = 'Completed';
                } else {
                    status = 'Active';
                }
            }

            return {
                id: auction.aid,
                auctionName: auction.name,
                startTime: new Date(auction.start_time).toLocaleString(),
                status,
                totalItems,
                itemsSold,
                itemsRemaining,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                avgSalePrice: parseFloat(avgSalePrice.toFixed(2)),
                uniqueBidders,
                totalBids,
                conversionRate: parseFloat(conversionRate.toFixed(1)),
                timeInterval: auction.time_interval
            };
        })
    );

    return auctionMetrics;
}