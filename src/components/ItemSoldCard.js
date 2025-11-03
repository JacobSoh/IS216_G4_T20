"use client";

import React from "react";
import { DollarSign, Calendar } from "lucide-react";

const ItemSoldCard = ({ iid, title, description, final_price, sold_at, picUrl }) => {
  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] transition-all duration-300 hover:scale-[1.02] hover:border-[var(--theme-primary)] hover:shadow-lg">
      <div className="relative flex h-40 items-center justify-center bg-[var(--theme-surface)]">
        {picUrl ? (
          <img src={picUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-[var(--theme-muted)]">No Image</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-[var(--theme-surface-contrast)] transition-colors group-hover:text-[var(--theme-primary)]">
          {title || "\u00A0\u00A0"}
        </h3>

        <p className="mb-3 line-clamp-3 text-sm text-[var(--theme-muted)]">
          {description || "\u00A0\u00A0"}
        </p>

        <div className="mb-2 flex items-center justify-between text-sm text-[var(--theme-muted)]">
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-[var(--theme-primary)]" />
            Final Price
          </span>
          <span className="font-semibold text-[var(--theme-primary)]">
            ${Number(final_price || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-[var(--theme-muted)]">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-[var(--theme-primary)]" />
            Sold On
          </span>
          <span className="font-medium text-[var(--theme-surface-contrast)]">
            {formatDate(sold_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemSoldCard;
