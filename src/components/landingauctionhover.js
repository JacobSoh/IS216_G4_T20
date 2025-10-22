'use client';
import React from 'react';

export const AuctionHoverPicture = ({ name, picUrl }) => {
  return (
    <div className="flex flex-col w-[29vw] max-w-[750px] group cursor-pointer mb-16 mx-auto">
      {/* Image */}
      <div className="relative w-full h-[500px] overflow-hidden rounded-sm">
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
      </div>

      {/* Spacer */}
      <div className="h-6" />

      {/* Auction name with hover arrow */}
      <div className="flex justify-between items-center">
        <h3 className="text-[3vh] text-purple-300 font-semibold transition-colors duration-300 group-hover:text-white">
          {name || 'Untitled Auction'}
        </h3>
        <span className="opacity-0 transform translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-green font-extrabold">
          →
        </span>
      </div>
    </div>
  );
};

export const AuctionHoverPictureSkeleton = () => {
  return (
    <div className="flex flex-col w-[29vw] max-w-[750px] animate-pulse mb-16 mx-auto">
      <div className="w-full h-[450px] rounded-md bg-purple-500/10" />
      <div className="h-6" />
      <div className="w-3/4 h-6 bg-purple-500/20 rounded-md mb-3" />
      <div className="w-1/6 h-6 bg-purple-500/10 rounded-md ml-auto" />
    </div>
  );
};
