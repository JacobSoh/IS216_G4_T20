"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Tooltip from "@mui/material/Tooltip";
import { LineChart } from "@mui/x-charts/LineChart";

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

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "$0.00";
  return `$${numeric.toFixed(2)}`;
}

function BidTooltipContent({ bids = [] }) {
  if (!bids.length) {
    return (
      <div className="rounded-md bg-slate-800 px-4 py-3 text-sm text-slate-200 shadow-lg">
        No bids recorded for this item.
      </div>
    );
  }

  const xData = bids.map((_, index) => `${index + 1}`);
  const yData = bids.map((bid) => Number(bid.amount ?? 0));

  return (
    <div className="rounded-md bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
      <div className="mb-2 text-xs uppercase tracking-wide text-slate-300">
        Bid progression
      </div>
      <div className="h-[160px] w-[260px]">
        <LineChart
          height={160}
          series={[
            {
              data: yData,
              label: "Bid amount",
              curve: "linear",
            },
          ]}
          xAxis={[
            {
              data: xData,
              scaleType: "point",
              label: "Bid #",
            },
          ]}
          margin={{ top: 16, right: 16, bottom: 32, left: 48 }}
          slotProps={{
            legend: { hidden: true },
          }}
        />
      </div>
    </div>
  );
}

function BidCountCell({ totalBids, bids }) {
  return (
    <Tooltip
      title={<BidTooltipContent bids={bids} />}
      placement="top"
      arrow
      enterDelay={200}
      leaveDelay={150}
    >
      <span className="cursor-help font-medium text-slate-100">
        {totalBids}
      </span>
    </Tooltip>
  );
}

const sorters = {
  itemTitle: (a, b) => a.itemTitle.localeCompare(b.itemTitle),
  auctionName: (a, b) => a.auctionName.localeCompare(b.auctionName),
  finalPrice: (a, b) => a.final_price - b.final_price,
  totalBids: (a, b) => a.totalBids - b.totalBids,
  soldAt: (a, b) =>
    new Date(a.sold_at ?? 0).getTime() - new Date(b.sold_at ?? 0).getTime(),
};

export default function RecentSalesTable({ soldItems = [], loading = false }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("soldAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return soldItems;
    return soldItems.filter((item) => {
      const itemTitle = item.itemTitle?.toLowerCase() ?? "";
      const auctionName = item.auctionName?.toLowerCase() ?? "";
      return itemTitle.includes(q) || auctionName.includes(q);
    });
  }, [query, soldItems]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const sorter = sorters[sortKey] ?? sorters.soldAt;
    arr.sort((a, b) => {
      const multiplier = sortDir === "asc" ? 1 : -1;
      return multiplier * sorter(a, b);
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
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return prev;
    });
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-800 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">
          Recent Sales
        </h2>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <CustomInput
              placeholder="Search by item or auction…"
              value={query}
              onChange={(event) => {
                setPage(1);
                setQuery(event.target.value);
              }}
            />
            <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
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
                  onClick={() => toggleSort("itemTitle")}
                >
                  Item <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("auctionName")}
                >
                  Auction <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="min-w-[160px] text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("finalPrice")}
                >
                  Sale Price <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="min-w-[140px] text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("totalBids")}
                >
                  Total Bids <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("soldAt")}
                >
                  Sold At <ArrowUpDown className="ml-1" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No recent sales found.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item) => (
                <TableRow key={item.row_id}>
                  <TableCell className="font-medium text-slate-100">
                    {item.itemTitle}
                  </TableCell>
                  <TableCell>{item.auctionName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.final_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <BidCountCell
                      totalBids={item.totalBids}
                      bids={item.bids}
                    />
                  </TableCell>
                  <TableCell>{formatDateTime(item.sold_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 py-3">
        <div className="text-sm text-slate-400">
          {loading
            ? "Loading…"
            : `${sorted.length} sale${sorted.length === 1 ? "" : "s"} found`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1 || loading}
          >
            <ChevronLeft className="mr-1" /> Previous
          </Button>
          <div className="text-sm text-slate-300">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((value) => Math.min(totalPages, value + 1))
            }
            disabled={currentPage >= totalPages || loading}
          >
            Next <ChevronRight className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
