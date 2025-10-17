'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import Spinner from '@/components/SpinnerComponent';
import getTimeAgo from '@/utils/getTimeAgo';

// Review Card Component
function ReviewCard({ review, supabase }) {
    const reviewerName = review.reviewer
        ? `${review.reviewer.first_name || ''} ${review.reviewer.last_name || ''}`.trim() || review.reviewer.username
        : 'Anonymous';

    const reviewerAvatarUrl = review.reviewer?.object_path
        ? supabase.storage.from(review.reviewer.avatar_bucket || 'avatar').getPublicUrl(review.reviewer.object_path).data.publicUrl
        : null;

    const reviewerInitial = reviewerName[0]?.toUpperCase() || 'A';

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {reviewerAvatarUrl ? (
                            <img
                                src={reviewerAvatarUrl}
                                alt={reviewerName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-sm">${reviewerInitial}</div>`;
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-sm">
                                {reviewerInitial}
                            </div>
                        )}
                    </div>

                    {/* Name & Time */}
                    <div>
                        <div className="font-semibold text-gray-800">{reviewerName}</div>
                        <div className="text-xs text-gray-500">{getTimeAgo({ datetime: review.time_created })}</div>
                    </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-base">
                        {"★".repeat(Math.floor(review.stars || 0))}
                        {"☆".repeat(5 - Math.floor(review.stars || 0))}
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                        {review.stars}
                    </span>
                </div>
            </div>

            {/* Review Text */}
            <p className="text-gray-700 text-sm leading-relaxed">
                {review.review || 'No review text provided'}
            </p>
        </div>
    );
}

export default function PopulateReviews({ userId }) {
    const supabase = supabaseBrowser();

    // Single state object
    const [state, setState] = useState({
        reviews: [],
        loading: true
    });

    // Single useEffect
    useEffect(() => {
        if (!userId) {
            console.log('[Reviews] No userId provided');
            setState({ reviews: [], loading: false });
            return;
        }

        const fetchReviews = async () => {
            console.log('[Reviews] Fetching reviews for userId:', userId);

            try {
                const { data, error } = await supabase
                    .from('review')
                    .select(`
                        *,
                        reviewer:reviewer_id (
                            id,
                            username,
                            first_name,
                            last_name,
                            avatar_bucket,
                            object_path
                        )
                    `)
                    .eq('reviewee_id', userId)
                    .order('time_created', { ascending: false });

                console.log('[Reviews] Query result:', { data, error, count: data?.length });

                if (error) {
                    console.error('[Reviews] Error:', error);
                    setState({ reviews: [], loading: false });
                } else {
                    setState({ reviews: data || [], loading: false });
                }
            } catch (error) {
                console.error('[Reviews] Exception:', error);
                setState({ reviews: [], loading: false });
            }
        };

        fetchReviews();
    }, [userId, supabase]);

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="md" className="text-blue-500" />
            </div>
        );
    }

    if (!state.reviews || state.reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl mb-4">⭐</div>
                <div className="text-xl text-gray-400 font-medium">No reviews yet</div>
                <p className="text-gray-500 mt-2">Reviews from others will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {state.reviews.map((review, index) => (
                <ReviewCard
                    key={`${review.reviewee_id}-${review.time_created}-${index}`}
                    review={review}
                    supabase={supabase}
                />
            ))}
        </div>
    );
}
