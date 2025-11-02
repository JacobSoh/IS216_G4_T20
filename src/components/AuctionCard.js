'use client';
import React from 'react';

export const AuctionHoverPicture = ({ name, picUrl }) => {
  return (
    <div className="flex flex-col w-[29vw] max-w-[750px] group cursor-pointer mb-16 mx-auto">
      {/* Image container with black dotted skeleton background */}
      <div className="relative w-full h-[500px] rounded-sm">
        {/* Black background with corner dots */}
        <div className="absolute inset-0 bg-black rounded-sm">
          <div className="absolute top-2 left-2 w-2 h-2 bg-purple-500 rounded-full" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-purple-600 rounded-full" />
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-purple-600 rounded-full" />
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
        </div>

        {/* Foreground image that shrinks more on hover */}
        <div className="relative w-full h-full overflow-hidden rounded-sm transition-transform duration-500 group-hover:scale-80">
          {picUrl ? (
            <img
              src={picUrl}
              alt={name}
              className="w-full h-full object-cover rounded-sm transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-purple-500/10 flex items-center justify-center text-purple-400 rounded-sm">
              No Image
            </div>
          )}

          {/* Purple tint overlay */}
          <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/30 transition-colors duration-500 rounded-sm pointer-events-none" />
        </div>
      </div>

      {/* Spacer */}
      <div className="h-6" />

      {/* Title + Arrow */}
      <div className="flex justify-between items-center">
        <h3 className="text-[3vh] text-purple-700 font-extrabold tracking-wide transition-colors duration-300 group-hover:text-gray-100">
          {name || 'Untitled Auction'}
        </h3>
        <span className="opacity-0 translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-white font-black text-[4vh]">
          →
        </span>
      </div>
    </div>
  );
};

export const AuctionHoverPictureSkeleton = () => {
  return (
    <div className="flex flex-col w-[29vw] max-w-[750px] mb-16 mx-auto animate-pulse">
      {/* Skeleton only behind image area */}
      <div className="relative w-full h-[500px] rounded-sm">
        <div className="absolute inset-0 bg-black rounded-sm">
          <div className="absolute top-2 left-2 w-2 h-2 bg-purple-400 rounded-full" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full" />
          <div className="absolute bottom-2 left-2 w-2 h-2 bg-purple-400 rounded-full" />
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-purple-400 rounded-full" />
        </div>
        <div className="relative w-full h-full bg-purple-500/10 rounded-sm z-10" />
      </div>

      {/* Spacer + text placeholders */}
      <div className="h-6" />
      <div className="w-3/4 h-6 bg-purple-500/20 rounded-md mb-3" />
      <div className="w-1/6 h-6 bg-purple-500/10 rounded-md ml-auto" />
    </div>
  );
};

export const AuctionCard = ({ name, description, picUrl, startTime, endTime }) => {
  return (
    <div className="flex flex-col w-[29vw] max-w-[300px] group cursor-pointer mb-16 mx-auto">
      {/* Image container */}
      <div className="relative w-full h-[300px] rounded-sm overflow-hidden">
        {picUrl ? (
          <img
            src={picUrl}
            alt={name}
            className="w-full h-full object-cover rounded-sm transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-purple-500/10 flex items-center justify-center text-purple-400 rounded-sm">
            No Image
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/20 transition-colors duration-500 rounded-sm pointer-events-none" />
      </div>

      <div className="h-4" />

      {/* Text + arrow */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg text-purple-300 font-bold group-hover:text-white">{name}</h3>
          <p className="text-sm text-purple-200 group-hover:text-white/90">{description}</p>
          <p className="text-xs text-purple-400 mt-1">
            {startTime} - {endTime}
          </p>
        </div>
        <span className="opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-white font-black text-2xl">
          →
        </span>
      </div>
    </div>
  );
};

// 2️⃣ Skeleton for AuctionCard
export const AuctionCardSkeleton = () => {
  return (
    <div className="flex flex-col w-[29vw] max-w-[300px] mb-16 mx-auto animate-pulse">
      <div className="relative w-full h-[300px] bg-purple-700 rounded-sm" />
      <div className="h-4" />
      <div className="w-3/4 h-6 bg-purple-500 rounded-md mb-2" />
      <div className="w-full h-4 bg-purple-300 rounded-md mb-1" />
      <div className="w-2/3 h-4 bg-purple-300 rounded-md" />
    </div>
  );
};

// 3️⃣ Category Card
export const CategoryCard = ({ name, picUrl }) => {
  return (
    <div className="flex flex-col w-[15vw] group cursor-pointer mb-16 mx-auto">
      <div className="relative w-full h-[300px] rounded-sm overflow-hidden">
        {picUrl ? (
          <img
            src={picUrl}
            alt={name}
            className="w-full h-full object-cover rounded-sm transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-purple-500/10 flex items-center justify-center text-purple-400 rounded-sm">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/20 transition-colors duration-500 rounded-sm pointer-events-none" />
      </div>

      <div className="h-4" />
      <div className="flex justify-between items-center">
        <h3 className="text-lg text-purple-300 font-bold group-hover:text-white">{name}</h3>
        <span className="opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-white font-black text-2xl">
          →
        </span>
      </div>
    </div>
  );
};

export const BigAuctionCard = ({ name, description, picUrl, endTime, currentBid }) => {
  return (
    <div className="relative w-full max-w-4xl mx-auto group rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.7)]">
      {/* Image */}
      <div className="relative w-full h-[500px] overflow-hidden rounded-2xl">
        {picUrl ? (
          <img
            src={picUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-purple-500/20 flex items-center justify-center text-purple-200">
            No Image
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-500 rounded-2xl" />
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-6 left-6 bg-purple-200/ backdrop-blur-none rounded-xl p-6 text-white w-[90%] max-w-[600px]">
        <h2 className="text-4xl font-extrabold">{name}</h2>
        <p className="mt-2 text-lg text-purple-200 line-clamp-2">{description}</p>
        <div className="mt-4 flex justify-between items-center text-xl">
          <span>Ends: {endTime}</span>
          {currentBid && <span>Current Bid: ${currentBid}</span>}
        </div>
      </div>
    </div>
  );
};

export const BigAuctionCardSkeleton = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-pulse">
      {/* Image Placeholder */}
      <div className="w-full h-[500px] bg-purple-900/20" />

      {/* Info Panel Placeholder */}
      <div className="absolute bottom-6 left-6 bg-purple-300/20 backdrop-blur-sm rounded-xl p-6 w-[90%] max-w-[600px]">
        <div className="h-8 bg-purple-400/40 rounded w-1/2 mb-3" />
        <div className="h-4 bg-purple-400/30 rounded w-3/4 mb-2" />
        <div className="h-4 bg-purple-400/30 rounded w-1/2 mb-4" />
        <div className="flex justify-between mt-4">
          <div className="h-5 bg-purple-400/30 rounded w-1/3" />
          <div className="h-5 bg-purple-400/30 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
};
