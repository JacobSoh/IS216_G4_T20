"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { supabaseBrowser } from "@/utils/supabase/client";

export default function PriceUpliftWaterfall({ sellerId }) {
  const sb = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [upliftData, setUpliftData] = useState([]);

  const fetchUpliftData = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch items_sold with item details and categories
      const { data: soldItems, error: soldError } = await sb
        .from("items_sold")
        .select(
          `
          sid,
          iid,
          final_price,
          item:iid(
            min_bid,
            item_category(category_name)
          )
        `
        )
        .eq("seller_id", sellerId);

      if (soldError) throw soldError;

      setUpliftData(soldItems || []);
    } catch (err) {
      console.error("Failed to load price uplift data", err);
      setUpliftData([]);
    } finally {
      setLoading(false);
    }
  }, [sb, sellerId]);

  useEffect(() => {
    fetchUpliftData();
  }, [fetchUpliftData]);

  // Realtime updates
  useEffect(() => {
    if (!sellerId) return undefined;
    const channel = sb
      .channel(`price-uplift-${sellerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items_sold",
          filter: `seller_id=eq.${sellerId}`,
        },
        () => fetchUpliftData()
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, sellerId, fetchUpliftData]);

  // Process data into waterfall format
  const waterfallData = useMemo(() => {
    if (!upliftData.length) return { categories: [], values: [], colors: [] };

    // Calculate uplift by category
    const categoryUplifts = {};
    let totalMinBid = 0;
    let totalFinalPrice = 0;

    upliftData.forEach((sale) => {
      const finalPrice = Number(sale.final_price || 0);
      const minBid = Number(sale.item?.min_bid || 0);
      const uplift = finalPrice - minBid;

      totalMinBid += minBid;
      totalFinalPrice += finalPrice;

      // Get categories for this item
      const categories = sale.item?.item_category || [];
      if (Array.isArray(categories) && categories.length > 0) {
        categories.forEach((cat) => {
          const categoryName = cat?.category_name || "Uncategorized";
          if (!categoryUplifts[categoryName]) {
            categoryUplifts[categoryName] = 0;
          }
          categoryUplifts[categoryName] += uplift;
        });
      } else {
        if (!categoryUplifts["Uncategorized"]) {
          categoryUplifts["Uncategorized"] = 0;
        }
        categoryUplifts["Uncategorized"] += uplift;
      }
    });

    const totalUplift = totalFinalPrice - totalMinBid;

    // Sort categories by uplift (descending)
    const sortedCategories = Object.entries(categoryUplifts).sort(
      ([, a], [, b]) => b - a
    );

    // Build waterfall: Start (min bid total) → categories → End (final price total)
    const categories = ["Start (Min Bids)"];
    const values = [totalMinBid];
    const colors = ["#94a3b8"]; // slate-400 for start

    let runningTotal = totalMinBid;

    sortedCategories.forEach(([categoryName, uplift]) => {
      categories.push(categoryName);
      values.push(uplift);
      colors.push(uplift >= 0 ? "#10b981" : "#ef4444"); // green-500 or red-500
      runningTotal += uplift;
    });

    categories.push("Total Revenue");
    values.push(totalFinalPrice);
    colors.push("#3b82f6"); // blue-500 for end

    return {
      categories,
      values,
      colors,
      totalUplift,
      upliftPercentage:
        totalMinBid > 0 ? ((totalUplift / totalMinBid) * 100).toFixed(1) : 0,
    };
  }, [upliftData]);

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

  if (upliftData.length === 0) {
    return (
      <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No sales data available. Price uplift analysis will appear here once
          items are sold.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Price-Uplift Waterfall
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2, fontSize: "0.875rem" }}
      >
        Value created beyond minimum bid per category — total uplift: $
        {waterfallData.totalUplift?.toFixed(2) || "0.00"} (
        {waterfallData.upliftPercentage}%)
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          height: 400,
        }}
      >
        <BarChart
          xAxis={[
            {
              scaleType: "band",
              data: waterfallData.categories,
              label: "Category",
            },
          ]}
          yAxis={[
            {
              label: "Price ($)",
            },
          ]}
          series={[
            {
              data: waterfallData.values,
              label: "Revenue",
              valueFormatter: (value) =>
                `$${Number(value || 0).toFixed(2)}`,
            },
          ]}
          colors={waterfallData.colors}
          margin={{ top: 20, right: 24, bottom: 72, left: 48 }}
          slotProps={{
            legend: { hidden: true },
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
          mt: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#94a3b8",
              borderRadius: "2px",
            }}
          />
          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
            Start (Min Bids)
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#10b981",
              borderRadius: "2px",
            }}
          />
          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
            Category Uplift
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#3b82f6",
              borderRadius: "2px",
            }}
          />
          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
            Total Revenue
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
