'use client'

import React from "react"
import { Calendar } from "lucide-react"

const ItemWonCard = ({ iid, title, description, final_price, sold_at, picUrl }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Image */}
      {/* <div className="h-40 bg-gray-200 relative overflow-hidden flex items-center justify-center">
        {picUrl ? (
          <img
            src={picUrl}
            alt={title}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-gray-400 text-sm font-medium">No Image</span>
        )}
      </div> */}

      {/* Card content */}
      <div className="flex flex-col flex-1">
        <h3 className="text-base font-semibold text-gray-800 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
          {title || '\u00A0\u00A0'}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {description || '\u00A0\u00A0'}
        </p>

        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-xs">Final Price</span>
          <span className="text-green-600 text-sm font-bold flex items-center gap-1">
            ${final_price.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Won On</span>
          <span className="text-gray-700 text-sm font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(sold_at)}
          </span>
        </div>
      </div>
    </>
  );
};

export default ItemWonCard;
