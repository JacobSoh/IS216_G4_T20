'use client';

import { useState } from 'react';

export default function ItemCard({ item, onEdit, onDelete }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [editHovered, setEditHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);

  const nextImage = () => {
    if (item.filePreviews.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % item.filePreviews.length);
    }
  };

  const prevImage = () => {
    if (item.filePreviews.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? item.filePreviews.length - 1 : prev - 1
      );
    }
  };

  return (
    <div 
      className="relative bg-[#1a1d24] border border-[#2d3139] rounded-lg p-6 transition-all duration-300"
      style={{
        borderColor: isHovered ? 'rgba(139, 92, 246, 0.5)' : '#2d3139'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* FIXED: Responsive layout - stacks on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row gap-6 items-center relative z-0">
        {/* Image Preview with Carousel */}
        <div className="relative flex-shrink-0 w-full sm:w-48 h-48 sm:h-32 bg-[#0f1115] rounded-lg overflow-hidden border border-[#2d3139]">
          {item.filePreviews.length > 0 ? (
            <>
              <img
                src={item.filePreviews[currentImageIndex]}
                alt={item.itemName}
                className="w-full h-full object-cover"
              />
              
              {/* Carousel Controls */}
              {item.filePreviews.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 transition-all z-30"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-1.5 transition-all z-30"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                    {item.filePreviews.map((_, idx) => (
                      <div
                        key={idx}
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          backgroundColor: idx === currentImageIndex ? '#8b5cf6' : 'rgba(255, 255, 255, 0.4)',
                          width: idx === currentImageIndex ? '24px' : '6px'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>

        {/* FIXED: Item Details - Stack on mobile, 3 columns on sm+ */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Item Name
            </span>
            <span className="text-xl font-semibold text-brand truncate w-full text-center sm:text-left">
              {item.itemName}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Price
            </span>
            <span className="text-2xl font-bold text-white">
              ${item.minBid.toFixed(2)}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Increment
            </span>
            <span className="text-2xl font-bold text-brand">
              +${item.bidIncrement.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Hover Overlay with Edit and Delete Buttons - Using React State for Hover */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex items-center justify-center gap-4 transition-all duration-300 z-50"
        style={{
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? 'auto' : 'none'
        }}
      >
        {/* Edit Button with State-based Hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          onMouseEnter={() => setEditHovered(true)}
          onMouseLeave={() => setEditHovered(false)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 pointer-events-auto"
          style={{
            backgroundColor: editHovered ? '#8b5cf6' : '#ffffff',
            color: editHovered ? '#ffffff' : '#000000',
            transform: editHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>

        {/* Delete Button with State-based Hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseEnter={() => setDeleteHovered(true)}
          onMouseLeave={() => setDeleteHovered(false)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 pointer-events-auto"
          style={{
            backgroundColor: deleteHovered ? '#b91c1c' : '#dc2626',
            color: '#ffffff',
            transform: deleteHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <svg 
            className="w-5 h-5 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{
              transform: deleteHovered ? 'rotate(12deg)' : 'rotate(0deg)'
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
