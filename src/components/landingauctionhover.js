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
        <h3 className="text-[3vh] text-purple-300 font-extrabold tracking-wide transition-colors duration-300 group-hover:text-white">
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
