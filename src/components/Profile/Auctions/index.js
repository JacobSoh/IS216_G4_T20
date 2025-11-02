"use client";

import { useState, useEffect, Fragment } from "react";
import { Tab } from '@headlessui/react';
import { supabaseBrowser } from '@/utils/supabase/client';
import Link from 'next/link';
import Spinner from '@/components/SpinnerComponent';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

// Helper functions
const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

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

        if (!active) {
          return;
        }

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
