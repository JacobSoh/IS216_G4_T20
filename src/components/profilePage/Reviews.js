'use client'

export default function PopulateReviews({ reviews }) {
    console.log(reviews);
    function timeAgo(datetime) {
        const now = new Date();
        const past = new Date(datetime);
        const diffMs = now - past;

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    return (
        <ul role="list" className="divide-y divide-gray-100">
            {reviews.map((formattedReview, index) => (
                <li key={index} className="flex justify-between gap-x-6 py-5">
                    <div className="flex min-w-0 gap-x-4">
                        <img
                            src={formattedReview.avatarUrl}
                            alt=""
                            className="size-12 flex-none rounded-full bg-gray-50"
                        />
                        <div className="min-w-0 flex-auto">
                            <p className="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">{formattedReview.reviewer}</p>
                            <p className="mt-1 truncate text-xs/5 text-gray-500 dark:text-gray-400">{formattedReview.review}</p>
                        </div>
                    </div>
                    <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                        <p className="text-sm/6 text-gray-900 dark:text-gray-100">
                            {"⭐".repeat(Math.floor(formattedReview.stars))}
                        </p>
                        <p className="mt-1 text-xs/5 text-gray-500 dark:text-gray-400">
                            <time dateTime={formattedReview.timeCreated}>
                                {timeAgo(formattedReview.timeCreated)}
                            </time>
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
}
