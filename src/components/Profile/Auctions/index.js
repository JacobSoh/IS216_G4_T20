"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabaseBrowser } from "@/utils/supabase/client";
import Spinner from "@/components/SpinnerComponent";

const AuctionTile = ({ auction }) => {
  const startsAt = auction.start_time
    ? new Date(auction.start_time).toLocaleString()
    : "TBA";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] transition-colors duration-300 hover:border-[var(--theme-primary)]">
      <div className="relative h-40 w-full bg-[var(--theme-surface)]">
        {auction.picUrl ? (
          <img
            src={auction.picUrl}
            alt={auction.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--theme-muted)]">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-[var(--theme-surface-contrast)]">
          {auction.name}
        </h3>
        <p className="line-clamp-3 text-sm text-[var(--theme-muted)]">
          {auction.description || "No description"}
        </p>
        <div className="mt-auto text-xs text-[var(--theme-muted)]">
          Starts:{" "}
          <span className="text-[var(--theme-surface-contrast)]">{startsAt}</span>
        </div>
      </div>
    </div>
  );
};

export default function Auctions({ userId }) {
  const sb = supabaseBrowser();
  const [state, setState] = useState({
    allAuctions: [],
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    let active = true;

    const fetchAuctions = async () => {
      try {
        const { data: auctions, error } = await sb
          .from("auction")
          .select(
            `
            aid,
            name,
            description,
            start_time,
            thumbnail_bucket,
            object_path
          `
          )
          .eq("oid", userId);

        if (error) {
          console.error("[Auctions] Failed to load auctions:", error);
          if (active) {
            setState((prev) => ({ ...prev, loading: false }));
          }
          return;
        }

        if (!active) return;

        const auctionsWithUrls =
          auctions?.map(({ object_path, thumbnail_bucket, ...rest }) => ({
            ...rest,
            picUrl: object_path
              ? sb.storage
                  .from(thumbnail_bucket || "thumbnail")
                  .getPublicUrl(object_path).data.publicUrl
              : null,
          })) ?? [];

        if (active) {
          setState({ allAuctions: auctionsWithUrls, loading: false });
        }
      } catch (err) {
        console.error("[Auctions] Error:", err);
        if (active) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchAuctions();

    return () => {
      active = false;
    };
  }, [userId, sb]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="md" className="text-[var(--theme-primary)]" />
      </div>
    );
  }

  if (!state.allAuctions.length) {
    return (
      <div className="py-20 text-center text-[var(--theme-muted)]">
        <p className="text-xl">No auctions yet</p>
      </div>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {state.allAuctions.map((auction) => (
        <Link
          key={auction.aid}
          href={`/auction/view/${auction.aid}`}
          className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary)]/40 rounded-md"
        >
          <AuctionTile auction={auction} />
        </Link>
      ))}
    </div>
  );
}
