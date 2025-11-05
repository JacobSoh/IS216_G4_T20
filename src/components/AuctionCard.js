'use client';
import React from 'react';

export const AuctionHoverPicture = ({ name, picUrl }) => {
  return (
    <div className="flex flex-col w-[29vw] md:w-[26vw] sm:w-[22vw] max-w-[750px] group cursor-pointer mb-16 mx-auto">
      {/* Image container with black dotted skeleton background */}
      <div className="relative w-full h-[500px] sm:h-[300px] md:h-[400px]  border-3 border-[var(--theme-secondary)] drop-shadow-[0_0_5px_rgba(168,85,247,0.9)] rounded-sm">
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
    <div className="flex flex-col w-[29vw] md:w-[26vw] sm:w-[22vw] max-w-[750px] mb-16 mx-auto animate-pulse">
      {/* Skeleton only behind image area */}
      <div className="relative w-full h-[500px] sm:h-[300px] md:h-[400px] rounded-sm">
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

export const AuctionCard = ({ name, description, start_time, picUrl }) => {
  return (
    <div
      className="w-[90vw] sm:w-[250px] md:w-[300px]
                 border-2 border-[var(--theme-secondary)]
                 bg-[var(--theme-primary)]
                 rounded-md shadow-[0_0_8px_rgba(168,85,247,0.9)]
                 flex flex-col transition-transform duration-300 hover:scale-[1.03]"
    >
      {/* Image */}
      <div className="w-full h-[40vw] sm:h-48 md:h-56 bg-gray-200 rounded-t-md overflow-hidden">
        {picUrl ? (
          <img
            src={picUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 min-h-[140px]">
        <h3 className="text-base sm:text-lg md:text-xl text-[var(--theme-cream)] font-bold mb-2 truncate">
          {name}
        </h3>
        <div className="text-xs sm:text-sm md:text-base text-[var(--theme-cream)] mb-2 line-clamp-4 overflow-hidden">
          {description}
        </div>
        {start_time && (
          <p className="text-[10px] sm:text-xs text-gray-400 mt-auto">
            Start: {new Date(start_time).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

// Skeleton Card
export const AuctionCardSkeleton = () => {
  return (
    <div
      className="w-[90vw] sm:w-[250px] md:w-[300px] 
                 border-2 border-[var(--theme-secondary)] 
                 bg-[var(--theme-primary)] 
                 rounded-md shadow-[0_0_8px_rgba(168,85,247,0.9)] 
                 animate-pulse flex flex-col"
    >
      {/* Image placeholder */}
      <div className="w-full h-[40vw] sm:h-48 md:h-56 bg-gray-300 rounded-t-md" />

      {/* Info placeholder */}
      <div className="p-4 flex flex-col flex-1 min-h-[140px]">
        <div className="h-6 bg-gray-400 rounded w-3/4 mb-2" /> {/* Name */}
        <div className="h-20 bg-gray-400 rounded w-full mb-2" /> {/* Description */}
        <div className="h-3 bg-gray-400 rounded w-1/2 mt-auto" /> {/* Start date */}
      </div>
    </div>
  );
};


// Category Card
export const CategoryCard = ({ name, picUrl }) => {
  return (
    <div className="flex flex-col w-[15vw] h-[25vw] group cursor-pointer mb-16 mx-auto">
      {/* Image Container with border and decorative dots */}
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden border-2 border-[var(--theme-secondary)]
                      shadow-[0_0_12px_rgba(176,38,255,0.5)] transition-all duration-500
                      group-hover:border-[var(--theme-accent)] group-hover:shadow-[0_0_25px_rgba(176,38,255,0.8)]">
        {/* Corner accent dots */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-[var(--theme-gold)] rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100 z-10" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--theme-accent)] rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100 z-10" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-[var(--theme-accent)] rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100 z-10" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-[var(--theme-gold)] rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100 z-10" />

        {picUrl ? (
          <>
            <img
              src={picUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Purple gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-secondary)]/50 via-[var(--theme-secondary)]/10 to-transparent
                            opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-[var(--theme-primary)] flex items-center justify-center text-[var(--theme-accent)] text-sm font-semibold">
            No Image
          </div>
        )}

        {/* Subtle top gradient */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
      </div>

      <div className="h-5" />

      {/* Title and Arrow */}
      <div className="flex justify-between items-center gap-2">
        <h3 className="text-lg text-[var(--theme-accent)] font-bold tracking-wide
                       transition-colors duration-300 group-hover:text-[var(--theme-cream)]">
          {name}
        </h3>
        <span className="opacity-0 translate-x-3 transition-all duration-300
                         group-hover:opacity-100 group-hover:translate-x-0
                         text-[var(--theme-gold)] font-black text-2xl shrink-0">
          →
        </span>
      </div>
    </div>
  );
};

export const BigAuctionCard = ({ name, description, picUrl, endTime, currentBid }) => {
  return (
    <div className="relative  lg:w-3xl md:w-[24vh] sm:w-2xl mx-auto group rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.7)]">
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

//Big Auction Card (featured_auction page)
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
