"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { supabaseBrowser } from "@/utils/supabase/client";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHourLabel(value) {
  if (!Number.isFinite(value)) return "";
  const hour = Number(value);
  if (hour < 0 || hour > 23) return "";
  const twelveHour = ((hour + 11) % 12) + 1;
  const suffix = hour < 12 ? "AM" : "PM";
  return `${twelveHour} ${suffix}`;
}

export default function BidHeatmap({ sellerId }) {
  const sb = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [bidData, setBidData] = useState([]);

  const fetchBidData = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First, get all items for this seller
      const { data: items, error: itemsError } = await sb
        .from("item")
        .select("iid")
        .eq("oid", sellerId);

      if (itemsError) throw itemsError;

      if (!items?.length) {
        setBidData([]);
        setLoading(false);
        return;
      }

      const itemIds = items.map((item) => item.iid);

      // Get all bids for these items
      const { data: bids, error: bidsError } = await sb
        .from("bid_history")
        .select("bid_datetime")
        .in("iid", itemIds);

      if (bidsError) throw bidsError;

      setBidData(bids || []);
    } catch (err) {
      console.error("Failed to load bid heatmap data", err);
      setBidData([]);
    } finally {
      setLoading(false);
    }
  }, [sb, sellerId]);

  useEffect(() => {
    fetchBidData();
  }, [fetchBidData]);

  // Realtime updates
  useEffect(() => {
    if (!sellerId) return undefined;
    const channel = sb
      .channel(`bid-heatmap-${sellerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bid_history" },
        () => fetchBidData()
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, sellerId, fetchBidData]);

  // Process data into hour x day-of-week buckets
  const heatmapData = useMemo(() => {
    const buckets = {};

    bidData.forEach((bid) => {
      if (!bid.bid_datetime) return;

      const date = new Date(bid.bid_datetime);
      const hour = date.getHours();
      const dow = date.getDay(); // 0 = Sunday, 6 = Saturday

      const key = `${dow}-${hour}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });

    // Convert to scatter plot data
    const scatterData = [];
    for (let dow = 0; dow < 7; dow++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${dow}-${hour}`;
        const count = buckets[key] || 0;
        if (count > 0) {
          scatterData.push({
            x: hour,
            y: dow,
            id: key,
            count,
          });
        }
      }
    }

    const maxCount = Math.max(...scatterData.map((d) => d.count), 1);

    return { scatterData, maxCount };
  }, [bidData]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (bidData.length === 0) {
    return (
      <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No bid data available. Bids will appear here once users start bidding
          on your items.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: "inherit" }}
      >
        Bid Heatmap
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, fontSize: "0.875rem" }}
      >
        Concentration of bids by hour and weekday — schedule auctions when
        bidders are most active
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          height: 400,
          width: "100%",
        }}
      >
        <ScatterChart
          series={[
            {
              data: heatmapData.scatterData,
              valueFormatter: ({ x, y, id }) => {
                const item = heatmapData.scatterData.find((d) => d.id === id);
                const hour = x;
                const day = DAYS_OF_WEEK[y];
                const hourLabel = formatHourLabel(hour);
                return `${day} ${hourLabel}: ${item?.count || 0} bids`;
              },
            },
          ]}
          xAxis={[
            {
              min: -1,
              max: 23,
              label: "Hour of Day",
              valueFormatter: (value) => formatHourLabel(value),
            },
          ]}
          yAxis={[
            {
              data: [0, 1, 2, 3, 4, 5, 6],
              scaleType: "band",
              label: "Day of Week",
              valueFormatter: (value) => DAYS_OF_WEEK[value] || "",
            },
          ]}
          margin={{ top: 20, right: 20, bottom: 50, left: 40 }}
        />
      </Box>
    </Box>
  );
}
