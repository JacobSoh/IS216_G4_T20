'use client';

import { supabaseBrowser } from '@/utils/supabase/client';

/**
 * Calculate the effective end time for an item based on anti-sniping rules
 */
export function calculateEffectiveEndTime(auctionEndTime, lastBidTime) {
    if (!auctionEndTime) return new Date();

    const auctionEnd = new Date(auctionEndTime);

    // No bids yet - use original auction end time
    if (!lastBidTime) {
        return auctionEnd;
    }

    const lastBid = new Date(lastBidTime);

    // Calculate time from bid to original auction end (in minutes)
    const minutesFromBidToEnd = (auctionEnd - lastBid) / 1000 / 60;

    // If bid was within 5 minutes of auction end OR after auction end (extended)
    // Then end time is bid + 5 minutes
    if (minutesFromBidToEnd < 5) {
        return new Date(lastBid.getTime() + 5 * 60 * 1000);
    }

    // Otherwise use original auction end
    return auctionEnd;
}

/**
 * Place a bid with wallet integration
 * - Checks wallet balance
 * - Holds funds for the bid
 * - Releases previous bidder's funds
 * - Creates transaction records
 */
export async function placeBid(itemId, userId, bidAmount) {
    const supabase = supabaseBrowser();

    try {
        // Step 1: Get item and auction details
        const { data: item, error: itemError } = await supabase
            .from('item')
            .select(`
                min_bid,
                oid,
                title,
                auction:aid (
                    end_time
                )
            `)
            .eq('iid', itemId)
            .single();

        if (itemError || !item?.auction?.end_time) {
            throw new Error('Could not fetch item or auction details');
        }

        // Prevent owner from bidding on their own item
        if (item.oid === userId) {
            throw new Error('You cannot bid on your own item');
        }

        // Step 2: Get current bid information
        const { data: currentBid } = await supabase
            .from('current_bid')
            .select('bid_datetime, current_price, uid, hold_transaction_id')
            .eq('iid', itemId)
            .maybeSingle();

        const now = new Date();
        const auctionEndTime = item.auction.end_time;
        const lastBidTime = currentBid?.bid_datetime || null;

        // Step 3: Calculate current effective end time
        const effectiveEndTime = calculateEffectiveEndTime(auctionEndTime, lastBidTime);

        console.log('=== BID DEBUG ===');
        console.log('Now:', now.toISOString());
        console.log('Auction End:', auctionEndTime);
        console.log('Last Bid:', lastBidTime);
        console.log('Effective End:', effectiveEndTime ? effectiveEndTime.toISOString() : 'null');
        console.log('Time until end (min):', effectiveEndTime ? (effectiveEndTime - now) / 1000 / 60 : 'N/A');

        // Step 4: Check if auction has ended
        if (now >= effectiveEndTime) {
            throw new Error('This auction has already ended');
        }

        // Step 5: Validate bid amount
        const minimumBid = currentBid?.current_price
            ? parseFloat(currentBid.current_price) + 0.01
            : parseFloat(item.min_bid);

        if (bidAmount < minimumBid) {
            throw new Error(`Bid must be at least $${minimumBid.toFixed(2)}`);
        }

        // Step 6: Prevent self-bidding
        if (currentBid?.uid === userId) {
            throw new Error('You are already the highest bidder');
        }

        // Step 7: Check wallet balance
        const { data: profile, error: profileError } = await supabase
            .from('profile')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error('Could not fetch wallet balance');
        }

        if (profile.wallet_balance < bidAmount) {
            throw new Error(`Insufficient wallet balance. You have $${profile.wallet_balance.toFixed(2)}, but need $${bidAmount.toFixed(2)}`);
        }

        // Step 8: Hold funds for this bid
        const { data: holdSuccess, error: holdError } = await supabase
            .rpc('hold_bid_funds', {
                user_id: userId,
                hold_amount: bidAmount
            });

        if (holdError || !holdSuccess) {
            console.error('Hold funds error:', holdError);
            throw new Error('Failed to hold funds. Please try again.');
        }

        // Step 9: Create transaction record for hold
        const { data: holdTransaction, error: holdTxError } = await supabase
            .from('wallet_transaction')
            .insert({
                uid: userId,
                transaction_type: 'hold',
                amount: bidAmount,
                status: 'completed',
                related_item_id: itemId,
                description: `Funds held for bid on: ${item.title}`,
                completed_at: now.toISOString()
            })
            .select()
            .single();

        if (holdTxError) {
            console.error('Transaction record error:', holdTxError);
            // Rollback: Release the held funds
            await supabase.rpc('release_held_funds', {
                user_id: userId,
                release_amount: bidAmount
            });
            throw new Error('Failed to record transaction');
        }

        // Step 10: If there was a previous bidder, release their funds
        if (currentBid && currentBid.uid !== userId) {
            const previousBidAmount = parseFloat(currentBid.current_price);

            const { error: releaseError } = await supabase
                .rpc('release_held_funds', {
                    user_id: currentBid.uid,
                    release_amount: previousBidAmount
                });

            if (releaseError) {
                console.error('Release previous bidder funds error:', releaseError);
            }

            // Create release transaction record
            await supabase
                .from('wallet_transaction')
                .insert({
                    uid: currentBid.uid,
                    transaction_type: 'release',
                    amount: previousBidAmount,
                    status: 'completed',
                    related_item_id: itemId,
                    description: `Funds released (outbid on: ${item.title})`,
                    completed_at: now.toISOString()
                });
        }

        // Step 11: Check if this bid will extend the auction
        const minutesRemaining = (effectiveEndTime - now) / 1000 / 60;
        const willExtend = minutesRemaining < 5;

        // Step 12: Place the bid
        const { error: bidError } = await supabase
            .from('current_bid')
            .upsert({
                iid: itemId,
                uid: userId,
                current_price: bidAmount,
                bid_datetime: now.toISOString(),
                oid: userId,
                funds_held: true,
                hold_transaction_id: holdTransaction.tid
            }, {
                onConflict: 'iid'
            });

        if (bidError) {
            console.error('Bid placement error:', bidError);
            // Rollback: Release the held funds
            await supabase.rpc('release_held_funds', {
                user_id: userId,
                release_amount: bidAmount
            });
            throw new Error(`Could not place bid: ${bidError.message}`);
        }

        // Step 13: Calculate new end time after this bid
        const newEffectiveEndTime = calculateEffectiveEndTime(auctionEndTime, now.toISOString());

        return {
            success: true,
            effectiveEndTime: newEffectiveEndTime,
            extended: willExtend,
            message: willExtend
                ? '⚡ Auction extended by 5 minutes (anti-snipe protection)'
                : 'Bid placed successfully!'
        };

    } catch (error) {
        console.error('Place bid error:', error);
        throw error;
    }
}
