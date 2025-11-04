import getTimeAgo from '@/utils/profile/getTimeAgo';
import AvgReview from '@/components/Profile/AvgReview';
import { Clock } from 'lucide-react';

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";


import {
    Avatar,
} from '@/components/Profile';

export default function ReviewCard({ review, sb, avatarSize = 12 }) {
    const reviewerName = review.reviewer
        ? `${review.reviewer.first_name || ''} ${review.reviewer.last_name || ''}`.trim() || review.reviewer.username
        : 'Anonymous';


    const reviewerAvatarUrl = review.reviewer?.object_path
        ? sb.storage.from(review.reviewer.avatar_bucket || 'avatar').getPublicUrl(review.reviewer.object_path).data.publicUrl
        : "/";


    const reviewerInitial = reviewerName[0]?.toUpperCase() || 'A';

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center gap-4">
                    <Avatar avatar_url={reviewerAvatarUrl} username={reviewerName} size={avatarSize} />
                    <div className="flex flex-col">
                        <h1 className="text-white text-xl font-bold m-0">{reviewerName}</h1>
                        <div className='flex items-center gap-1'>
                            <Clock size={15} /> {getTimeAgo({ datetime: review.time_created })}
                        </div>
                    </div>
                </div>
                <CardAction className='mx-auto'>
                    <AvgReview number={review.stars || 0} />
                </CardAction>
            </CardHeader>
            <CardContent>
                <p className='text-center sm:text-start'>{review.review || 'No review text provided'}</p>
            </CardContent>
        </Card>
    );
}
