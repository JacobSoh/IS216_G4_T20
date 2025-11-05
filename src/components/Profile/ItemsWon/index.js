'use client';

import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from '@/utils/supabase/client';
import Spinner from '@/components/SpinnerComponent';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { toast } from "sonner";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CustomSelect, CustomTextarea } from "@/components/Form";
import { useModal } from "@/context/ModalContext";

const MIN_REVIEW_LENGTH = 10;

function ReviewFormFields({ initialStars, initialReview }) {
    return (
        <div className="space-y-4">
            <div className="max-w-xs">
                <CustomSelect
                    type="review-stars"
                    label="Rating"
                    placeholder="Select rating"
                    defaultValue={initialStars}
                    options={Array.from({ length: 5 }, (_, idx) => {
                        const val = (idx + 1).toString();
                        return {
                            value: val,
                            label: `${val} star${val !== "1" ? "s" : ""}`,
                        };
                    }).reverse()}
                />
            </div>

            <div>
                <Label htmlFor="review-text" className="text-[var(--theme-muted)]">
                    Share your experience
                </Label>
                <CustomTextarea
                    type="reviewText"
                    id="review-text"
                    name="review-text"
                    defaultValue={initialReview}
                    placeholder="Tell other buyers about this seller..."
                    autoGrow
                    className="mt-1 border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-surface-contrast)] focus-visible:ring-[var(--theme-primary)]"
                />
            </div>
        </div>
    );
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export default function ItemsWon({ userId }) {
    const sb = supabaseBrowser();
    const { setModalHeader, setModalFooter, setModalState, setModalForm } = useModal();

    const [state, setState] = useState({
        wonItems: [],
        loading: true,
    });

    useEffect(() => {
        if (!userId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchWonItems = async () => {
            try {
                // Fetch items won by the user
                const { data: wonItems, error } = await sb
                    .from('items_sold')
                    .select(`
                        sid,
                        final_price,
                        sold_at,
                        seller_id,
                        item:iid (
                            iid,
                            title,
                            description,
                            item_bucket,
                            object_path
                        ),
                        auction:aid (
                            aid,
                            name
                        ),
                        seller:seller_id (
                            id,
                            username,
                            first_name,
                            last_name
                        )
                    `)
                    .eq('buyer_id', userId)
                    .order('sold_at', { ascending: false });

                if (error || !wonItems) {
                    console.error('Error fetching won items:', error);
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }

                // Transform data for display
                const itemsWithUrls = wonItems
                    .filter(sale => sale.item) // Filter out any without item data
                    .map(({ sid, item, auction, final_price, sold_at, seller_id, seller }) => ({
                        iid: item.iid,
                        sid: sid,
                        aid: auction?.aid,
                        auctionName: auction?.name,
                        sellerId: seller_id,
                        sellerProfile: seller ?? null,
                        title: item.title,
                        description: item.description,
                        final_price: final_price,
                        sold_at: sold_at,
                        picUrl: sb.storage
                            .from(item.item_bucket || 'item')
                            .getPublicUrl(item.object_path).data.publicUrl
                    }));

                const sellerIds = Array.from(new Set(itemsWithUrls.map(item => item.sellerId).filter(Boolean)));
                let reviewMap = new Map();

                if (sellerIds.length > 0) {
                    const { data: existingReviews, error: reviewError } = await sb
                        .from("review")
                        .select("reviewee_id, reviewer_id, review, stars, time_created")
                        .eq("reviewer_id", userId)
                        .in("reviewee_id", sellerIds);

                    if (reviewError) {
                        console.error("[ItemsWon] Error fetching existing reviews:", reviewError);
                    } else {
                        existingReviews?.forEach((review) => {
                            const current = reviewMap.get(review.reviewee_id);
                            if (!current) {
                                reviewMap.set(review.reviewee_id, review);
                                return;
                            }
                            const existingTime = new Date(current.time_created).getTime();
                            const incomingTime = new Date(review.time_created).getTime();
                            if (incomingTime > existingTime) {
                                reviewMap.set(review.reviewee_id, review);
                            }
                        });
                    }
                }

                const enrichedItems = itemsWithUrls.map(item => ({
                    ...item,
                    existingReview: item.sellerId ? reviewMap.get(item.sellerId) ?? null : null,
                }));

                setState({ wonItems: enrichedItems, loading: false });

            } catch (error) {
                console.error('[ItemsWon] Error:', error);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchWonItems();
    }, [userId, sb]);

    const handleReviewSubmit = useCallback(async (event, sellerId, existingReview) => {
        event.preventDefault();
        if (!sellerId || !userId) return;

        const formData = new FormData(event.currentTarget);
        const stars = Number(formData.get("review-stars"));
        const reviewBody = (formData.get("review-text") || "").toString().trim();

        if (!reviewBody || reviewBody.length < MIN_REVIEW_LENGTH) {
            toast.error(`Review must be at least ${MIN_REVIEW_LENGTH} characters.`);
            return;
        }

        if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
            toast.error("Rating must be between 1 and 5 stars.");
            return;
        }

        try {
            if (existingReview) {
                const { error: deleteError } = await sb
                    .from("review")
                    .delete()
                    .eq("reviewee_id", sellerId)
                    .eq("reviewer_id", userId);
                if (deleteError) throw deleteError;
            }

            const { error: insertError } = await sb.from("review").insert([
                {
                    reviewee_id: sellerId,
                    reviewer_id: userId,
                    review: reviewBody,
                    stars,
                },
            ]);

            if (insertError) throw insertError;

            const newReview = {
                reviewee_id: sellerId,
                reviewer_id: userId,
                review: reviewBody,
                stars,
                time_created: new Date().toISOString(),
            };

            setState(prev => ({
                ...prev,
                wonItems: prev.wonItems.map(item =>
                    item.sellerId === sellerId
                        ? { ...item, existingReview: newReview }
                        : item
                )
            }));

            toast.success("Review saved.");
            setModalState({ open: false });
        } catch (err) {
            console.error("[ItemsWon] Failed to submit review", err);
            toast.error(err.message ?? "Unable to submit review.");
        }
    }, [sb, userId, setModalState]);

    const openReviewModal = useCallback((item) => {
        if (!item?.sellerId) return;

        const existingReview = item.existingReview;
        const initialStars = existingReview ? String(existingReview.stars ?? 5) : "5";
        const initialReview = existingReview?.review ?? "";

        const sellerProfile = item.sellerProfile;
        const sellerDisplayName =
            sellerProfile?.username ||
            [sellerProfile?.first_name, sellerProfile?.last_name].filter(Boolean).join(" ") ||
            "this seller";

        const modalTitle = existingReview ? "Update your review" : "Leave a review";
        const modalDescription = existingReview
            ? `You can revise your previous review for ${sellerDisplayName}.`
            : `Share your experience with ${sellerDisplayName}.`;

        setModalHeader({
            title: modalTitle,
            description: modalDescription,
        });
        setModalFooter({
            showCancel: true,
            cancelText: "Cancel",
            cancelVariant: "outline",
            showSubmit: true,
            submitText: existingReview ? "Save changes" : "Submit review",
            submitVariant: "brand",
        });
        setModalForm({
            isForm: true,
            onSubmit: (event) => handleReviewSubmit(event, item.sellerId, existingReview),
        });
        setModalState({
            open: true,
            content: (
                <ReviewFormFields
                    initialStars={initialStars}
                    initialReview={initialReview}
                />
            ),
        });
    }, [handleReviewSubmit, setModalFooter, setModalForm, setModalHeader, setModalState]);

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="md" className="text-blue-500" />
            </div>
        );
    }

    if (!state.wonItems || state.wonItems.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="flex justify-center mb-4">
                    <TrophyIcon className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-xl text-gray-500">No items won yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mt-2">
            {state.wonItems.map((item) => (
                <Card key={item.iid} className="flex flex-col h-full pt-0 min-h-115">
                    <div>
                        {item?.picUrl ? (
                            <img
                                src={item?.picUrl}
                                alt={item?.title}
                                className="h-full w-full min-h-50 max-h-50 object-cover rounded-t-xl"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-40 bg-[var(--theme-primary-darker)] rounded-t-xl font-bold text-sm">
                                No image
                            </div>
                        )}
                    </div>
                    <CardHeader className="pt-0 !flex flex-1 flex-col items-start gap-2">
                        <CardTitle className="w-full">
                            {item?.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                            {item?.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-white text-xs">Final Price</span>
                            <span className="text-[var(--theme-gold)] text-sm font-bold">
                                {item?.final_price.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white text-xs">Won On</span>
                            <span className="text-gray-400 text-sm font-medium">
                                {formatDate(item?.sold_at)}
                            </span>
                        </div>
                        {item?.sellerId && (
                            <Button
                                variant="brand"
                                className="w-full"
                                onClick={() => openReviewModal(item)}
                            >
                                {item?.existingReview ? "Update review" : "Leave a review"}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
