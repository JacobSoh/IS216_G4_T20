'use client';

import { supabaseBrowser } from '@/utils/supabase/client';

// Constants
const ANTI_SNIPE_MINUTES = 5;
const MIN_BID_INCREMENT = 0.01;

/**
 * Calculate the effective end time for an item based on anti-sniping rules
 * If bid is within 5 minutes of auction end, extend by 5 minutes
 */
export function calculateEffectiveEndTime(auctionEndTime, lastBidTime) {
    if (!auctionEndTime) return new Date();

    const auctionEnd = new Date(auctionEndTime);

    if (!lastBidTime) {
        return auctionEnd;
    }

    const lastBid = new Date(lastBidTime);
    const minutesFromBidToEnd = (auctionEnd - lastBid) / 1000 / 60;

    // Extend by 5 minutes if bid was within 5 minutes of end
    if (minutesFromBidToEnd < ANTI_SNIPE_MINUTES) {
        return new Date(lastBid.getTime() + ANTI_SNIPE_MINUTES * 60 * 1000);
    }

    return auctionEnd;
}

/**
 * Validate bid requirements
 */
function validateBid({ item, currentBid, bidAmount, userId, now, effectiveEndTime }) {
    // Check auction ended
    if (now >= effectiveEndTime) {
        throw new Error('This auction has already ended');
    }

    // Check owner bidding
    if (item.oid === userId) {
        throw new Error('You cannot bid on your own item');
    }

    // Check minimum bid amount
    const minimumBid = currentBid?.current_price
        ? parseFloat(currentBid.current_price) + MIN_BID_INCREMENT
        : parseFloat(item.min_bid);

    if (bidAmount < minimumBid) {
        throw new Error(`Bid must be at least $${minimumBid.toFixed(2)}`);
    }

    // Check self-bidding
    if (currentBid?.uid === userId) {
        throw new Error('You are already the highest bidder');
    }
}

/**
 * Handle wallet operations for bidding
 */
async function handleWalletOperations(supabase, { userId, bidAmount, currentBid, itemId, itemTitle, now }) {
    // Check wallet balance
    const { data: profile, error: profileError } = await supabase
        .from('profile')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        throw new Error('Could not fetch wallet balance');
    }

    if (profile.wallet_balance < bidAmount) {
        throw new Error(
            `Insufficient wallet balance. You have $${profile.wallet_balance.toFixed(2)}, but need $${bidAmount.toFixed(2)}`
        );
    }

    // Hold funds for this bid
    const { data: holdSuccess, error: holdError } = await supabase
        .rpc('hold_bid_funds', {
            user_id: userId,
            hold_amount: bidAmount
        });

    if (holdError || !holdSuccess) {
        console.error('Hold funds error:', holdError);
        throw new Error('Failed to hold funds. Please try again.');
    }

    // Create hold transaction record
    const { data: holdTransaction, error: holdTxError } = await supabase
        .from('wallet_transaction')
        .insert({
            uid: userId,
            transaction_type: 'hold',
            amount: bidAmount,
            status: 'completed',
            related_item_id: itemId,
            description: `Funds held for bid on: ${itemTitle}`,
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

    // Release previous bidder's funds
    if (currentBid && currentBid.uid !== userId) {
        const previousBidAmount = parseFloat(currentBid.current_price);

        await supabase.rpc('release_held_funds', {
            user_id: currentBid.uid,
            release_amount: previousBidAmount
        });

        // Create release transaction record
        await supabase
            .from('wallet_transaction')
            .insert({
                uid: currentBid.uid,
                transaction_type: 'release',
                amount: previousBidAmount,
                status: 'completed',
                related_item_id: itemId,
                description: `Funds released (outbid on: ${itemTitle})`,
                completed_at: now.toISOString()
            });
    }

    return holdTransaction;
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
    const now = new Date();

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

        // Step 2: Get current bid information
        const { data: currentBid } = await supabase
            .from('current_bid')
            .select('bid_datetime, current_price, uid, hold_transaction_id')
            .eq('iid', itemId)
            .maybeSingle();

        // Step 3: Calculate effective end time
        const effectiveEndTime = calculateEffectiveEndTime(
            item.auction.end_time,
            currentBid?.bid_datetime || null
        );

        // Step 4: Validate bid
        validateBid({
            item,
            currentBid,
            bidAmount,
            userId,
            now,
            effectiveEndTime
        });

        // Step 5: Handle wallet operations
        const holdTransaction = await handleWalletOperations(supabase, {
            userId,
            bidAmount,
            currentBid,
            itemId,
            itemTitle: item.title,
            now
        });

        // Step 6: Calculate if auction will extend
        const minutesRemaining = (effectiveEndTime - now) / 1000 / 60;
        const willExtend = minutesRemaining < ANTI_SNIPE_MINUTES;

        // Step 7: Place the bid
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

        // Step 8: Calculate new end time after this bid
        const newEffectiveEndTime = calculateEffectiveEndTime(item.auction.end_time, now.toISOString());

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
