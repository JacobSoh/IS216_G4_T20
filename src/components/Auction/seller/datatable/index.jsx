"use client";

import React, { useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";
import {
  ArrowUpDown,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { supabaseBrowser } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/Form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function isItemSold(item) {
  const value = item?.sold;
  if (value === true || value === 1 || value === "true") return true;
  if (value === false || value === 0 || value === "false") return false;
  return value != null ? Boolean(value) : false;
}

function deriveStatus(auction, items, { ready }) {
  try {
    const startMs = auction?.start_time
      ? new Date(auction.start_time).getTime()
      : null;
    if (!startMs || Number.isNaN(startMs)) return "scheduled";

    const now = Date.now();
    if (now < startMs) return "scheduled";

    if (!Array.isArray(items)) {
      const fallbackItems = Array.isArray(auction?.items) ? auction.items : [];
      if (!ready) return "live";
      if (!fallbackItems.length) return "ended";
      const hasPendingFallback = fallbackItems.some((item) => !isItemSold(item));
      return hasPendingFallback ? "live" : "ended";
    }

    if (!items.length) {
      return ready ? "ended" : "live";
    }

    const hasPending = items.some((item) => !isItemSold(item));
    return hasPending ? "live" : "ended";
  } catch (error) {
    console.warn("[SellerDatatable] Failed to derive status", error);
    return "scheduled";
  }
}

const statusOrder = { draft: 0, scheduled: 1, live: 2, ended: 3 };

export default function SellerDatatable({ auctions = [] }) {
  const sb = supabaseBrowser();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState("status");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [auctionItems, setAuctionItems] = useState({});
  const [itemsReady, setItemsReady] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    const ids = (auctions ?? [])
      .map((auction) => auction?.aid)
      .filter((id) => Boolean(id));
    if (!ids.length) {
      setAuctionItems({});
      setItemsReady(true);
      setItemsLoading(false);
      return;
    }

    let active = true;
    setItemsLoading(true);
    setItemsReady(false);

    sb
      .from("item")
      .select("aid, sold")
      .in("aid", ids)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("[SellerDatatable] Failed to fetch items", error);
          setAuctionItems({});
          setItemsReady(true);
          setItemsLoading(false);
          return;
        }

        const grouped = (data ?? []).reduce((acc, item) => {
          const key = item?.aid;
          if (!key) return acc;
          if (!acc[key]) acc[key] = [];
          acc[key].push({ sold: item?.sold ?? null });
          return acc;
        }, {});

        setAuctionItems(grouped);
        setItemsReady(true);
        setItemsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[SellerDatatable] Unexpected item fetch error", err);
        setAuctionItems({});
        setItemsReady(true);
        setItemsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sb, auctions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (auctions || [])
      .map((auction) => {
        const items = auctionItems[auction?.aid] ?? auction?.items;
        return {
          ...auction,
          _status: deriveStatus(auction, items, { ready: itemsReady }),
        };
      })
      .filter((auction) => {
        const title = auction?.name || "";
        const matchQuery = !q || title.toLowerCase().includes(q);
        const matchStatus = status === "all" || auction._status === status;
        return matchQuery && matchStatus;
      });
  }, [query, status, auctions, auctionItems, itemsReady]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "title": {
          const at = (a.name || "").toString();
          const bt = (b.name || "").toString();
          return dir * at.localeCompare(bt);
        }
        case "bids":
          return dir * ((a.bids ?? 0) - (b.bids ?? 0));
        case "startAt": {
          const av = a.start_time ? new Date(a.start_time).getTime() : 0;
          const bv = b.start_time ? new Date(b.start_time).getTime() : 0;
          return dir * (av - bv);
        }
        case "endAt": {
          const av = a.end_time ? new Date(a.end_time).getTime() : 0;
          const bv = b.end_time ? new Date(b.end_time).getTime() : 0;
          return dir * (av - bv);
        }
        case "status":
        default:
          return dir * (statusOrder[a._status] - statusOrder[b._status]);
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage]);

  function toggleSort(key) {
    setPage(1);
    setSortKey((k) => {
      if (k !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return k;
    });
  }

  const loading = itemsLoading;

  return (
    <div className="bg-slate-800 rounded-md p-4 border border-slate-700">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <CustomInput
              placeholder="Search auctions by title…"
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
            />
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          </div>
        </div>
        <div>
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="h-10 rounded-md border bg-[var(--theme-surface)] border-[var(--theme-border)] px-3 text-sm text-[var(--theme-surface-contrast)]"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("title")}
                >
                  Title <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("status")}
                >
                  Status <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("startAt")}
                >
                  Start <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("endAt")}
                >
                  End <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("bids")}
                >
                  Bids <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="text-right min-w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((auction) => (
                <TableRow key={auction.aid}>
                  <TableCell className="font-medium">{auction.name}</TableCell>
                  <TableCell className="capitalize">{auction._status}</TableCell>
                  <TableCell>{formatDate(auction.start_time)}</TableCell>
                  <TableCell>{formatDate(auction.end_time)}</TableCell>
                  <TableCell className="text-right">
                    {auction.bids ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          redirect(`/auction/view/${auction.aid}/manage`)
                        }
                      >
                        <Eye /> View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          redirect(`/auction/seller/edit/${auction.aid}`)
                        }
                      >
                        <Pencil /> Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 py-3">
        <div className="text-muted-foreground text-sm">
          {loading ? (
            "Loading…"
          ) : sorted.length === 0 ? (
            "0 of 0 row(s)"
          ) : (
            `${(currentPage - 1) * pageSize + 1}-${Math.min(
              currentPage * pageSize,
              sorted.length
            )} of ${sorted.length}`
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1 || loading}
          >
            <ChevronLeft /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage >= totalPages || loading}
          >
            Next <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
