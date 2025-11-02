"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";

import { supabaseBrowser } from "@/utils/supabase/client";
import RecentSalesTable from "@/components/Auction/seller/recentlySold";

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "$0.00";
  return `$${numeric.toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return "—";
  }
}

export default function SellerDashboard({ auctions = [] }) {
  console.log("here", auctions);
  const sb = supabaseBrowser();
  const [sellerId, setSellerId] = useState(() => auctions?.[0]?.oid ?? null);
  const [soldRows, setSoldRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auctions?.length) return;
    const inferredSeller = auctions[0]?.oid ?? null;
    if (inferredSeller && inferredSeller !== sellerId) {
      setSellerId(inferredSeller);
    }
  }, [auctions, sellerId]);

  useEffect(() => {
    if (sellerId || !sb) return;
    let active = true;
    sb.auth.getUser().then(({ data }) => {
      if (!active) return;
      const nextId = data?.user?.id ?? null;
      if (nextId) {
        setSellerId(nextId);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error("Failed to resolve seller identity", err);
      if (active) {
        setError("Unable to determine seller account.");
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [sb, sellerId]);

  const fetchSoldItems = useCallback(async () => {
    if (!sellerId) {
      console.warn(
        "[SellerDashboard] fetchSoldItems skipped — no sellerId available."
      );
      setSoldRows([]);
      setLoading(false);
      return;
    }
    console.info("[SellerDashboard] Fetching items_sold for seller:", sellerId);
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await sb
        .from("items_sold")
        .select(
          "sid, final_price, sold_at, aid, iid, auction:aid(name), item:iid(title)"
        )
        .eq("seller_id", sellerId)
        .order("sold_at", { ascending: true });

      if (queryError) {
        throw queryError;
      }

      console.debug(
        "[SellerDashboard] Raw items_sold data:",
        data?.map(({ sid, aid, final_price, sold_at }) => ({
          sid,
          aid,
          final_price,
          sold_at,
        }))
      );

      const soldItems = (data ?? []).map((item, index) => ({
        row_id: item.sid ?? `${item.aid ?? "unknown"}-${index}`,
        sid: item.sid ?? null,
        iid: item.iid ?? null,
        aid: item.aid ?? null,
        final_price: Number(item.final_price ?? 0),
        sold_at: item.sold_at ?? null,
        auctionName: item?.auction?.name ?? "Untitled Auction",
        itemTitle: item?.item?.title ?? "Untitled Item",
      }));

      const itemIds = soldItems
        .map((entry) => entry.iid)
        .filter((value) => Boolean(value));

      let bidsByItem = new Map();
      if (itemIds.length > 0) {
        const { data: bidsData, error: bidsError } = await sb
          .from("bid_history")
          .select("iid, bid_amount, bid_datetime")
          .in("iid", itemIds)
          .order("bid_datetime", { ascending: true });

        if (bidsError) {
          throw bidsError;
        }

        bidsByItem = bidsData.reduce((acc, bid) => {
          const key = bid.iid;
          if (!key) return acc;
          const list = acc.get(key) ?? [];
          list.push({
            amount: Number(bid.bid_amount ?? 0),
            datetime: bid.bid_datetime ?? null,
          });
          acc.set(key, list);
          return acc;
        }, new Map());
      }

      const enriched = soldItems.map((item) => {
        const bids = bidsByItem.get(item.iid) ?? [];
        return {
          ...item,
          bids,
          totalBids: bids.length,
        };
      });

      setSoldRows(enriched);
    } catch (err) {
      console.error("Failed to load seller revenue data", err);
      setError(err.message ?? "Failed to load revenue data.");
      setSoldRows([]);
    } finally {
      setLoading(false);
    }
  }, [sb, sellerId]);

  useEffect(() => {
    fetchSoldItems();
  }, [fetchSoldItems]);

  useEffect(() => {
    if (!sellerId) return undefined;

    const channel = sb
      .channel(`seller-dashboard-items_sold-${sellerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items_sold",
          filter: `seller_id=eq.${sellerId}`,
        },
        () => {
          fetchSoldItems();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, sellerId, fetchSoldItems]);

  const chartData = useMemo(() => {
    console.debug("[SellerDashboard] Recomputing chart data with rows:", soldRows);
    if (!soldRows.length) {
      return {
        points: [],
        dates: [],
        revenueValues: [],
        totalRevenue: 0,
        totalSold: 0,
      };
    }

    const buckets = new Map();
    soldRows.forEach((row) => {
      if (!row?.sold_at) return;
      const soldDate = new Date(row.sold_at);
      if (Number.isNaN(soldDate.getTime())) return;

      const key = `${soldDate.getUTCFullYear()}-${String(
        soldDate.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(soldDate.getUTCDate()).padStart(2, "0")}`;

      const entry =
        buckets.get(key) ||
        {
          key,
          date: new Date(
            Date.UTC(
              soldDate.getUTCFullYear(),
              soldDate.getUTCMonth(),
              soldDate.getUTCDate()
            )
          ),
          revenue: 0,
          count: 0,
        };

      entry.revenue += Number(row.final_price ?? 0);
      entry.count += 1;

      buckets.set(key, entry);
    });

    const points = Array.from(buckets.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const dates = points.map((point) => point.date);
    const revenueValues = points.map((point) =>
      Number(point.revenue.toFixed(2))
    );
    const totalRevenue = points.reduce(
      (sum, point) => sum + point.revenue,
      0
    );
    const totalSold = points.reduce((sum, point) => sum + point.count, 0);

    return {
      points,
      dates,
      revenueValues,
      totalRevenue,
      totalSold,
    };
  }, [soldRows]);

  useEffect(() => {
    console.info("[SellerDashboard] Chart summary", {
      totalPoints: chartData.points.length,
      totalRevenue: chartData.totalRevenue,
      totalSold: chartData.totalSold,
      dates: chartData.dates.map((d) => d.toISOString?.() ?? d),
      revenueValues: chartData.revenueValues,
    });
  }, [chartData]);

  const tableRows = useMemo(
    () =>
      soldRows.map((row) => ({
        id: row.row_id,
        auctionName: row?.auction?.name ?? "Untitled Auction",
        soldAt: row.sold_at,
        finalPrice: Number(row.final_price ?? 0),
      })),
    [soldRows]
  );

  const columns = useMemo(
    () => [
      {
        field: "auctionName",
        headerName: "Auction",
        flex: 1,
        minWidth: 200,
      },
      {
        field: "soldAt",
        headerName: "Sold At",
        flex: 1,
        minWidth: 200,
        valueFormatter: ({ value }) => formatDateTime(value),
      },
      {
        field: "finalPrice",
        headerName: "Sale Revenue",
        type: "number",
        flex: 0.7,
        minWidth: 150,
        valueFormatter: ({ value }) => formatCurrency(value),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Lifetime Revenue</p>
          <p className="text-2xl font-semibold text-slate-100">
            {formatCurrency(chartData.totalRevenue)}
          </p>
        </div>
        <div className="rounded-md border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Items Sold</p>
          <p className="text-2xl font-semibold text-slate-100">
            {chartData.totalSold}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            Revenue Over Time
          </h2>
        </div>
        <div className="mt-6">
          {loading && !chartData.dates.length ? (
            <p className="text-sm text-slate-400">Loading revenue data…</p>
          ) : chartData.dates.length ? (
            <LineChart
              height={320}
              xAxis={[
                {
                  scaleType: "time",
                  data: chartData.dates,
                  valueFormatter: (value) => {
                    const date =
                      value instanceof Date ? value : new Date(value);
                    return date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                  },
                },
              ]}
              series={[
                {
                  id: "revenue",
                  label: "Revenue",
                  data: chartData.revenueValues,
                  curve: "monotoneX",
                },
              ]}
              margin={{ top: 16, right: 24, bottom: 32, left: 60 }}
              slotProps={{ legend: { hidden: true } }}
            />
          ) : (
            <p className="text-sm text-slate-400">
              No sales yet. Once your items sell, revenue trends will appear
              here.
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>

      <RecentSalesTable soldItems={soldRows} loading={loading} />
    </div>
  );
}
