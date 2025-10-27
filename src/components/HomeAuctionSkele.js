'use client'
import React from "react";

/**
 * AuctionCardSkeleton
 * - A placeholder loading card shown while auction data is being fetched.
 * - Mimics the layout of AuctionCard with shimmer animation.
 */
const AuctionCardSkeleton = () => (
  <div className="bg-white rounded-md overflow-hidden border border-gray-200 animate-pulse">
    {/* Image placeholder */}
    <div className="h-40 bg-gray-200" />

    {/* Text placeholders */}
    <div className="p-4 space-y-3">
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      <div className="h-8 w-full bg-gray-300 rounded mt-4"></div>
    </div>
  </div>
);

export default AuctionCardSkeleton;
