'use client';
import React from 'react';

// AuctionMinimal component
export const AuctionMinimal = ({ name, startTime, picUrl, align = 'center' }) => {
  const alignment =
    align === 'left'
      ? 'items-start text-left'
      : align === 'right'
      ? 'items-end text-right'
      : 'items-center text-center';

  return (
    <div className={`flex flex-col ${alignment} w-full max-w-[600px] relative group`}>
      {/* Image */}
      <div className="relative w-full h-[400px] overflow-hidden rounded-2xl">
        {picUrl ? (
          <img
            src={picUrl}
            alt={name}
            className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-purple-500/10 flex items-center justify-center text-purple-400 rounded-2xl">
            No Image
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="h-8" />

      {/* Auction info */}
      <div className="relative z-10">
        <h3 className="text-2xl font-semibold text-purple-400 mb-2 group-hover:text-purple-300 transition-colors">
          {name || 'Untitled Auction'}
        </h3>
        {startTime && (
          <p className="text-sm text-purple-500/80">
            Starts: {new Date(startTime).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

// Skeleton component
export const AuctionMinimalSkeleton = () => {
  return (
    <div className="flex flex-col items-center w-full max-w-[600px] animate-pulse">
      <div className="w-full h-[400px] rounded-2xl bg-purple-500/10 overflow-hidden" />
      <div className="h-8" />
      <div className="w-3/4 h-6 bg-purple-500/20 rounded-md mb-3" />
      <div className="w-1/2 h-4 bg-purple-500/10 rounded-md" />
    </div>
  );
};

export const AuctionHoverPictureSkeleton = () => {
  return (
    <div className="flex flex-col w-full max-w-[500px] animate-pulse">
      <div className="w-full h-[300px] rounded-xl bg-purple-500/10" />
      <div className="h-4" />
      <div className="w-3/4 h-6 bg-purple-500/20 rounded-md mb-2" />
      <div className="w-1/6 h-6 bg-purple-500/10 rounded-md ml-auto" />
    </div>
  );
};
