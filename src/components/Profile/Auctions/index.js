"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

import { supabaseBrowser } from "@/utils/supabase/client";
import Spinner from "@/components/SpinnerComponent";
import { CustomSelect } from "@/components/Form";

const STATUS_BADGES = {
  live: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  scheduled: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  ended: "bg-rose-500/15 text-rose-300 border-rose-500/40",
};

const STATUS_LABEL = {
  live: "Live",
  scheduled: "Scheduled",
  ended: "Ended",
};

const statusPriority = { live: 2, scheduled: 1, ended: 0 };

function isItemSold(item) {
  const value = item?.sold;
  if (value === true || value === "true" || value === 1) return true;
  if (value === false || value === "false" || value === 0) return false;
  return Boolean(value);
}

function deriveAuctionStatus(auction, items = []) {
  try {
    const startMs = auction?.start_time
      ? new Date(auction.start_time).getTime()
      : null;
    if (!startMs || Number.isNaN(startMs)) return "scheduled";

    const now = Date.now();
    if (now < startMs) return "scheduled";

    if (!Array.isArray(items) || items.length === 0) {
      return "ended";
    }

    const hasUnsold = items.some((item) => !isItemSold(item));
    return hasUnsold ? "live" : "ended";
  } catch (error) {
    console.warn("[Auctions] Unable to derive status", error);
    return "scheduled";
  }
}

function formatDateTime(value) {
  if (!value) return "TBA";
  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "TBA";
  }
}

const AuctionCard = ({ auction }) => {
  const badgeClass =
    STATUS_BADGES[auction.status] ||
    "bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] border-[var(--theme-primary)]/40";
  const statusLabel = STATUS_LABEL[auction.status] ?? "Unknown";
  const formattedStart = formatDateTime(auction.start_time);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] transition-all duration-300 hover:scale-[1.02] hover:border-[var(--theme-primary)] hover:shadow-lg">
      <div className="relative flex h-40 items-center justify-center bg-[var(--theme-surface)]">
        {auction.thumbnailUrl ? (
          <img
            src={auction.thumbnailUrl}
            alt={auction.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-[var(--theme-muted)]">
            No Image
          </span>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-[var(--theme-surface-contrast)] transition-colors group-hover:text-[var(--theme-primary)]">
          {auction.name || "\u00A0\u00A0"}
        </h3>

        <p className="mb-3 line-clamp-3 text-sm text-[var(--theme-muted)]">
          {auction.description || "No description provided."}
        </p>

        <div className="mt-auto space-y-2 text-sm text-[var(--theme-muted)]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-[var(--theme-primary)]" />
              Status
            </span>
            <span className="font-semibold text-[var(--theme-surface-contrast)]">
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-[var(--theme-primary)]" />
              Starts
            </span>
            <span className="font-medium text-[var(--theme-surface-contrast)]">
              {formattedStart}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Auctions({ userId }) {
  const sb = supabaseBrowser();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("live");

  useEffect(() => {
    if (!userId) {
      setAuctions([]);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: queryError } = await sb
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
          .eq("oid", userId)
          .order("start_time", { ascending: true });

        if (queryError) {
          throw queryError;
        }

        if (!active) return;

        const records = data ?? [];
        const ids = records.map((record) => record?.aid).filter(Boolean);

        let itemsByAuction = new Map();
        if (ids.length > 0) {
          const { data: itemsData, error: itemsError } = await sb
            .from("item")
            .select("aid, sold")
            .in("aid", ids);

          if (itemsError) {
            console.error("[Auctions] Failed to load auction items:", itemsError);
          } else {
            itemsByAuction = itemsData.reduce((map, row) => {
              const key = row?.aid;
              if (!key) return map;
              const list = map.get(key) ?? [];
              list.push({ sold: row.sold });
              map.set(key, list);
              return map;
            }, new Map());
          }
        }

        const normalized =
          records
            .map(({ thumbnail_bucket, object_path, start_time, ...rest }) => {
              const items = itemsByAuction.get(rest.aid) ?? [];
              const status = deriveAuctionStatus({ start_time }, items);
              const bucket = thumbnail_bucket || "thumbnail";
              const thumbnailUrl =
                object_path && bucket
                  ? sb.storage.from(bucket).getPublicUrl(object_path).data.publicUrl
                  : null;

              return {
                ...rest,
                start_time,
                status,
                thumbnailUrl,
              };
            }) ?? [];

        const sorted = normalized
          .sort((a, b) => {
            const statusDiff =
              (statusPriority[b.status] ?? -1) - (statusPriority[a.status] ?? -1);
            if (statusDiff !== 0) return statusDiff;
            const aStart = a.start_time ? new Date(a.start_time).getTime() : 0;
            const bStart = b.start_time ? new Date(b.start_time).getTime() : 0;
            return aStart - bStart;
          });

        if (active) {
          setAuctions(sorted);
          setLoading(false);
        }
      } catch (err) {
        console.error("[Auctions] Failed to load auctions:", err);
        if (active) {
          setError(err?.message ?? "Unable to load auctions.");
          setAuctions([]);
          setLoading(false);
        }
      }
    };

    fetchAuctions();

    return () => {
      active = false;
    };
  }, [userId]);

  const filteredAuctions = useMemo(() => {
    if (statusFilter === "live") {
      const liveAuctions = auctions.filter((auction) => auction.status === "live");
      if (liveAuctions.length > 0) {
        return liveAuctions;
      }
      return auctions.filter((auction) => auction.status === "scheduled");
    }
    return auctions.filter((auction) => auction.status === statusFilter);
  }, [auctions, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="md" className="text-[var(--theme-primary)]" />
      </div>
    );
  }

  if (!auctions.length) {
    return (
      <div className="py-20 text-center text-[var(--theme-muted)]">
        <p className="text-xl">
          {error ? "Unable to load auctions." : "No auctions yet"}
        </p>
      </div>
    );
  }

  const noMatches = filteredAuctions.length === 0;
  const emptyMessage =
    statusFilter === "live"
      ? "No live or scheduled auctions at the moment."
      : statusFilter === "scheduled"
      ? "No scheduled auctions at the moment."
      : "No ended auctions yet.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xs w-full">
          <CustomSelect
            type="auctionStatusFilter"
            label="Status"
            placeholder="Select status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { value: "live", label: "Live" },
              { value: "scheduled", label: "Scheduled" },
              { value: "ended", label: "Ended" },
            ]}
          />
        </div>
      </div>

      {noMatches ? (
        <div className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center text-[var(--theme-muted)]">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredAuctions.map((auction) => (
            <Link
              key={auction.aid}
              href={`/auction/view/${auction.aid}`}
              className="block focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary)]/40"
            >
              <AuctionCard auction={auction} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
