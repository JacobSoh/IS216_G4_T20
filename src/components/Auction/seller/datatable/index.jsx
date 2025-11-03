"use client";

import React, { useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Pencil, ChevronLeft, ChevronRight, Search, Trash } from "lucide-react";

import { supabaseBrowser } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/Form";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CustomSelect } from "@/components/Form/CustomSelect";
import { supabaseBrowser } from "@/utils/supabase/client";

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
  };

  function SortIcon({ column }) {
    if (sortKey !== column) return <ArrowUpDown className="ml-1" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1" />
    ) : (
      <ArrowDown className="ml-1" />
    );
  }

  const loading = itemsLoading;

  return (
    <div className="space-y-4">
      <div className="relative">
        <CustomInput
          placeholder="Search auctions by title…"
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
        />
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {
          loading ? (
            <span>loading</span>
          ) : paged.length === 0 ? (
            <span>Null</span>
          ) : paged.map(v => {
            const sb = supabaseBrowser();
            const picUrl = sb.storage
              .from(v.thumbnail_bucket || 'thumbnail')
              .getPublicUrl(v.object_path).data.publicUrl
            return (
              <Card key={v.aid}>
                <CardHeader>
                  {picUrl ? (
                    <img
                      src={picUrl}
                      alt={v?.title}
                      className="object-cover w-full max-h-40 bg-white rounded-md"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full min-h-40 max-h-40 bg-[var(--theme-primary-darker)] rounded-md font-bold">
                      NO IMAGE
                    </div>
                  )}
                  <CardTitle className='mt-4'>
                    {v?.title}
                  </CardTitle>
                  <CardDescription className='line-clamp-4'>
                    {v?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-xs">Final Price</span>
                    <span className="text-[var(--theme-gold)] text-sm font-bold flex items-center gap-1">
                      {/* ${item?.final_price.toFixed(2)} */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white text-xs">Won On</span>
                    <span className="text-gray-400 text-sm font-medium flex items-center gap-1">
                      {/* <Calendar className="w-3 h-3" /> */}
                      {/* {formatDate(item?.sold_at)} */}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        }
      </div>
      <Card>
        <CardContent>
          {/* <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("title")}>
                    Title <SortIcon column="title" />
                  </Button>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("startAt")}>
                    Start <SortIcon column="startAt" />
                  </Button>
                </TableHead>
                <TableHead className="text-right min-w-[100px]">
                  <Button variant="ghost" size="sm" onClick={() => toggleSort("bids")}>
                    Bids <SortIcon column="bids" />
                  </Button>
                </TableHead>
                <TableHead className="text-right min-w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading…</TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No results.</TableCell>
                </TableRow>
              ) : (
                paged.map((a) => (
                  <TableRow key={a.aid}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{formatDate(a.start_time)}</TableCell>
                    <TableCell className="text-right">{a.bids ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="gold_white" size="sm" onClick={() => window.location.href = `/auction/view/${a.aid}/manage`}>
                          <Eye /> View
                        </Button>
                        <Button variant="brand" size="sm" onClick={() => window.location.href = `/auction/seller/edit/${a.aid}`}>
                          <Pencil /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => window.location.href = `/auction/view/${a.aid}/manage`}>
                          <Trash /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table> */}
        </CardContent>
      </Card>

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
