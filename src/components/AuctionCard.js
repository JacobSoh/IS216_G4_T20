"use client";
import React from "react";
import Link from "next/link";

export const AuctionHoverPicture = ({
  name,
  picUrl,
  ownerUsername,
  ownerAvatar,
}) => {
  // Build avatar URL
  const avatarUrl =
    ownerAvatar?.bucket && ownerAvatar?.objectPath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${ownerAvatar.bucket}/${ownerAvatar.objectPath}`
      : "/images/avatar-placeholder.png";

  return (
    <div className="flex flex-col w-[85%] sm:w-[85%] md:w-[80%] lg:w-[90%] xl:w-[85%] max-w-[750px] group mb-16 mx-auto">
      {/* Image container with black dotted skeleton background */}
      <div className="relative w-full h-[50vw] sm:h-[40vw] md:h-[35vw] lg:h-[30vw] xl:h-[25vw] border-3 border-[var(--theme-secondary)] drop-shadow-[0_0_5px_rgba(168,85,247,0.9)] rounded-sm cursor-pointer">
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
      <div className="h-2" />

      {/* Title + Arrow */}
      <div className="flex flex-col cursor-pointer">
        {/* Auction Title + Arrow */}
        <div className="flex justify-between items-center">
          <h3
            className="text-xl sm:text-24px md:text-24px lg:text-35px font-semibold text-purple-700 tracking-tight truncate"
            title={name || "Untitled Auction"} // tooltip on hover
          >
            {name || "Untitled Auction"}
          </h3>
          <span className="opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-purple-700 font-extrabold text-2xl sm:text-3xl">
            →
          </span>
        </div>

        {/* Owner info */}
        {ownerUsername && (
          <Link
            href={`/user/${ownerUsername}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 mt-1 text-gray-400 hover:text-purple-300 transition-colors duration-300"
          >
            <img
              src={avatarUrl}
              alt={ownerUsername}
              className="w-4 h-4 sm:w-7 sm:h-7 rounded-full object-cover border border-purple-500"
            />
            <span className="truncate text-sm sm:text-base">@{ownerUsername}</span>
          </Link>
        )}
      </div>

      {/* Seller Profile Link */}
      {/* {ownerUsername && (
        <Link
          href={`/user/${ownerUsername}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-3"
        >
          <div className="flex items-center gap-3 px-3 py-2 bg-black/60 border border-purple-500/50 rounded-md hover:bg-black/80 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300 cursor-pointer">
            <img
              src={avatarUrl}
              alt={ownerUsername}
              className="w-8 h-8 rounded-full object-cover border-2 border-purple-400/50"
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-purple-300 uppercase tracking-wide">
                Hosted by
              </span>
              <span className="text-sm text-white font-semibold">
                @{ownerUsername}
              </span>
            </div>
          </div>
        </Link>
      )} */}
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

export const AuctionCard = ({
  name,
  owner, // { username, avatar }
  description,
  start_time,
  picUrl,
  auctionLink, // pass /auction/view/${aid} here
}) => {
  return (
    <Link href={auctionLink}>
      <div
        className="w-[90vw] sm:w-[250px] md:w-[300px]
                   h-[420px] sm:h-[430px] md:h-[450px]
                   border-2 border-[var(--theme-secondary)]
                   bg-[var(--theme-primary)]
                   rounded-md shadow-[0_0_8px_rgba(168,85,247,0.9)]
                   flex flex-col transition-transform duration-300 hover:scale-[1.03]
                   cursor-pointer"
      >
        {/* 🖼 Auction Image */}
        <div className="w-full h-[45vw] sm:h-48 md:h-56 bg-gray-200 rounded-t-md overflow-hidden">
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

        {/* 🧾 Info Section */}
        <div className="p-4flex flex-col flex-1 min-h-[160px]">
          {/* Auction Name */}
          <h3 className="text-base pl-1 pb-2 sm:text-lg md:text-xl text-[var(--theme-cream)] font-bold truncate">
            {name}
          </h3>

          {/* 👤 Owner (clickable avatar + name) */}
          {owner?.username && (
            <Link
              href={`/user/${owner.username}`}
              onClick={(e) => e.stopPropagation()} // Prevent clicking the owner from triggering card link
              className="flex items-center gap-2 pl-1.5 text-xs sm:text-sm text-gray-400 mb-2 hover:text-[var(--theme-accent)] transition-colors duration-300"
            >
              {/* Avatar */}
              <img
                src={owner.avatar || "/images/avatar-placeholder.png"}
                alt={owner.username}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-[var(--theme-secondary)]"
              />
              <span className="truncate">@{owner.username}</span>
            </Link>
          )}

          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base text-[var(--theme-cream)] mb-3 pl-1.5 overflow-hidden text-ellipsis line-clamp-3">
            {description}
          </p>

          {/* Start Time */}
          {start_time && (
            <p className="text-[10px] pl-1.5 sm:text-xs text-gray-400 mt-auto">
              Start: {new Date(start_time).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export const AuctionCardSkeleton = () => {
  return (
    <div
      className="w-[90vw] sm:w-[250px] md:w-[300px] 
                 h-[420px] sm:h-[430px] md:h-[450px]
                 border-2 border-[var(--theme-secondary)] 
                 bg-[var(--theme-primary)] 
                 rounded-md shadow-[0_0_8px_rgba(168,85,247,0.9)] 
                 animate-pulse flex flex-col"
    >
      {/* Image placeholder */}
      <div className="w-full h-[45vw] sm:h-48 md:h-56 bg-gray-300 rounded-t-md" />

      {/* Info placeholder */}
      <div className="p-4 flex flex-col flex-1 min-h-[160px]">
        <div className="h-6 bg-gray-400 rounded w-3/4 mb-2" /> {/* Name */}
        <div className="h-4 bg-gray-400 rounded w-1/2 mb-3" /> {/* Owner */}
        <div className="h-16 bg-gray-400 rounded w-full mb-3" />{" "}
        {/* Description */}
        <div className="h-3 bg-gray-400 rounded w-1/2 mt-auto" />{" "}
        {/* Start date */}
      </div>
    </div>
  );
};

// Category Card
export const CategoryCard = ({ name, picUrl }) => {
  return (
    <div
      className="
    flex flex-col group cursor-pointer mx-auto
    mb-10 sm:mb-12 md:mb-14 lg:mb-16
    w-[85%] sm:w-[92%] md:w-[86%] lg:w-[91%] xl:w-[91%] 2xl:w-[98%]
    max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] xl:max-w-[500px]
  "
    >
      {/* Image Container */}
      <div
        className="
          relative w-full aspect-[3/4] rounded-lg overflow-hidden
          border-2 border-[var(--theme-secondary)]
          shadow-[0_0_12px_rgba(176,38,255,0.5)]
          transition-all duration-500
          group-hover:border-[var(--theme-accent)]
          group-hover:shadow-[0_0_25px_rgba(176,38,255,0.8)]
        "
      >
        {/* Corner Dots */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-[var(--theme-gold)] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--theme-accent)] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-[var(--theme-accent)] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-[var(--theme-gold)] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 z-10" />

        {/* Image or Placeholder */}
        {picUrl ? (
          <>
            <img
              src={picUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-secondary)]/50 via-[var(--theme-secondary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-[var(--theme-primary)] flex items-center justify-center text-[var(--theme-accent)] text-sm font-semibold">
            No Image
          </div>
        )}

        {/* Top Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Spacing below image */}
      <div className="h-3 sm:h-4 md:h-5 lg:h-6" />

      {/* Title + Arrow */}
      <div className="flex justify-between items-center gap-2 px-2 sm:px-3 md:px-0">
        <h3
          className="
            text-base sm:text-lg md:text-xl lg:text-2xl
            text-[var(--theme-accent)] font-bold tracking-wide
            transition-colors duration-300 group-hover:text-[var(--theme-cream)]
          "
        >
          {name}
        </h3>
        <span
          className="
            opacity-0 translate-x-3 transition-all duration-300
            group-hover:opacity-100 group-hover:translate-x-0
            text-[var(--theme-gold)] font-black text-xl sm:text-2xl lg:text-3xl shrink-0
          "
        >
          →
        </span>
      </div>
    </div>
  );
};

export const BigAuctionCard = ({ name, description, picUrl, start_time }) => {
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
        <p className="mt-2 text-lg text-purple-200 line-clamp-2">
          {description}
        </p>
        <div className="mt-4 flex justify-between items-center text-xl">
          <span>Starts: {start_time}</span>
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
