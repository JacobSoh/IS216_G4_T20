'use client';


import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/utils/supabase/client';
import Spinner from '@/components/SpinnerComponent';
import ReviewCard from '@/components/Profile/Review/ReviewCard';

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";


export default function PopulateReviews({ userId }) {
    const sb = supabaseBrowser();


    const [state, setState] = useState({
        reviews: [],
        loading: true
    });


    useEffect(() => {
        if (!userId) {
            setState({ reviews: [], loading: false });
            return;
        }


        const fetchReviews = async () => {
            try {
                const { data, error } = await sb
                    .from('review')
                    .select(`
                        *,
                        reviewer:reviewer_id (
                            username,
                            first_name,
                            last_name,
                            avatar_bucket,
                            object_path
                        )
                    `)
                    .eq('reviewee_id', userId)
                    .order('time_created', { ascending: false });


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
    }, [userId, sb]);


    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse" />
                    <Spinner size="md" className="relative text-blue-500" />
                </div>
            </div>
        );
    }


    if (!state.reviews || state.reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                    <div className="relative text-7xl animate-bounce">⭐</div>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">
                    No reviews yet
                </div>
                <p className="text-gray-500 text-center max-w-md">
                    Be the first to share your experience! Reviews from others will appear here.
                </p>
            </div>
        );
    }


    return (
        <div className="space-y-4">
            {state.reviews.map((review, index) => (
                <div
                    key={`${review.reviewee_id}-${review.time_created}-${index}`}
                    className="p-5"
                >
                    <ReviewCard review={review} sb={sb} />
                </div>
            ))}
        </div>
    );
}
