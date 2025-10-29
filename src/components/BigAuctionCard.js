'use client';
import React from 'react';

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
      <div className="absolute bottom-6 left-6 bg-purple-200/ backdrop-blur-sm rounded-xl p-6 text-white w-[90%] max-w-[600px]">
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
