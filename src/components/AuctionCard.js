'use client';
import React from "react";
import { Clock } from "lucide-react";

const AuctionCard = ({
  aid,
  name,
  description,
  startTime,
  endTime,
  picUrl,
  buttonText = "View Auction",
  hideButton = false
}) => (
  <div className="group bg-[#13202e] rounded-md overflow-hidden border border-[#154D71] hover:border-[#49aee9] transition-all duration-300 hover:shadow-lg flex flex-col h-full">
    {/* Image */}
    <div className="h-40 bg-gray-200 relative overflow-hidden flex items-center justify-center">
      {picUrl ? (
        <img src={picUrl} alt={name} className="object-cover w-full h-full" />
      ) : (
        <span className="text-[#e3e3e4af] text-sm font-medium">No Image</span>
      )}
    </div>

    {/* Card content */}
    <div className="p-4 flex flex-col flex-1">
      <div className="flex-1">
        <h3 className="text-base font-semibold text-gray-100 mb-2 group-hover:text-[#33A1E0] transition-colors line-clamp-2">
          {name || '\u00A0\u00A0'}
        </h3>

        <p className="text-gray-200 text-sm mb-3 line-clamp-3">
          {description || '\u00A0\u00A0'}
        </p>

        {/* Optional start/end times */}
        {(startTime || endTime) && (
          <div className="flex justify-between items-center mb-3 text-xs text-gray-200">
            {startTime && <span>Starts: {startTime}</span>}
            {endTime && <span>Ends: {endTime}</span>}
          </div>
        )}
        {/* Optional start/end times */}
        {(startTime || endTime) && (
          <div className="flex justify-between items-center mb-3 text-xs text-gray-200">
            {startTime && <span>Starts: {startTime}</span>}
            {endTime && <span>Ends: {endTime}</span>}
          </div>
        )}
      </div>

      {/* Button */}
      {!hideButton && (
        <button className="w-full bg-[#33A1E0] text-white py-2 rounded font-medium hover:bg-[#2492d2] transition-colors text-sm mt-auto">
          {buttonText}
        </button>
      )}
      {/* Button */}
      {!hideButton && (
        <button className="w-full bg-[#33A1E0] text-white py-2 rounded font-medium hover:bg-[#2492d2] transition-colors text-sm mt-auto">
          {buttonText}
        </button>
      )}
    </div>
  </div>
);

export default AuctionCard;
