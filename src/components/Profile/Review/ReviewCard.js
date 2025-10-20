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
        <div className="group bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out">
            {/* Decorative accent bar */}
            {/* <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}


            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    {/* Avatar with animated border */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 ring-2 ring-white shadow-md">
                            {reviewerAvatarUrl ? (
                                <img
                                    src={reviewerAvatarUrl}
                                    alt={reviewerName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">${reviewerInitial}</div>`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                                    {reviewerInitial}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Name & Time */}
                    <div>
                        <div className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-200">
                            {reviewerName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {getTimeAgo({ datetime: review.time_created })}
                        </div>
                    </div>
                </div>


                {/* Floating badge with rating */}
                <div className="flex flex-col items-end">
                    <AvgReview number={review.stars || 0} />
                </div>
            </div>


            {/* Review Text with gradient fade */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2 p-2" />
                <p className="relative text-gray-700 text-base leading-relaxed pl-3 border-l-4 border-transparent group-hover:border-blue-400 transition-all duration-300">
                    {review.review || 'No review text provided'}
                </p>
            </div>


            {/* Verified badge (waiting for verified) */}
            {review.verified && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Verified Purchase</span>
                </div>
            )}
        </div>
    );
}