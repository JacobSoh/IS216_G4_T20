import getTimeAgo from '@/utils/profile/getTimeAgo';
import AvgReview from '@/components/Profile/AvgReview';


export default function ReviewCard({ review, sb }) {
    const reviewerName = review.reviewer
        ? `${review.reviewer.first_name || ''} ${review.reviewer.last_name || ''}`.trim() || review.reviewer.username
        : 'Anonymous';


    const reviewerAvatarUrl = review.reviewer?.object_path
        ? sb.storage.from(review.reviewer.avatar_bucket || 'avatar').getPublicUrl(review.reviewer.object_path).data.publicUrl
        : null;


    const reviewerInitial = reviewerName[0]?.toUpperCase() || 'A';


    return (
        <div className="group bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[var(--theme-primary)]/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="relative">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--theme-surface)] flex-shrink-0 ring-2 ring-[var(--theme-primary)]/40 shadow-md">
                            {reviewerAvatarUrl ? (
                                <img
                                    src={reviewerAvatarUrl}
                                    alt={reviewerName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-[var(--theme-primary)] text-white font-bold text-lg">${reviewerInitial}</div>`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[var(--theme-primary)] text-white font-bold text-lg">
                                    {reviewerInitial}
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:block">
                            <div className="font-bold text-[var(--theme-surface-contrast)] text-lg break-words whitespace-normal leading-tight">
                                {reviewerName}
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--theme-muted)]">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {getTimeAgo({ datetime: review.time_created })}
                        </div>
                        <div className="mt-2 flex flex-col gap-1 text-xs text-[var(--theme-muted)] sm:hidden">
                            <div className="flex items-center gap-2">
                                <AvgReview number={review.stars || 0} />
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {getTimeAgo({ datetime: review.time_created })}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="hidden sm:flex flex-col items-end">
                    <AvgReview number={review.stars || 0} />
                </div>
            </div>


            <div className="relative">
                <p className="relative text-[var(--theme-surface-contrast)] text-base leading-relaxed pl-3 border-l-4 border-transparent break-words whitespace-pre-wrap">
                    {review.review || 'No review text provided'}
                </p>
            </div>


            {review.verified && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Verified Purchase</span>
                </div>
            )}
        </div>
    );
}
