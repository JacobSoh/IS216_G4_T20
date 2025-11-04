"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { supabaseBrowser } from "@/utils/supabase/client";

// Calculate percentile
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  if (upper >= sorted.length) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export default function ReserveCalibration({ sellerId }) {
  const sb = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [ratioData, setRatioData] = useState([]);

  const fetchReserveData = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch items_sold with item min_bid and categories
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

      // Process ratios by category
      const categoryRatios = [];

      soldItems?.forEach((sale) => {
        const finalPrice = Number(sale.final_price || 0);
        const minBid = Number(sale.item?.min_bid || 0);

        if (minBid > 0) {
          const ratio = finalPrice / minBid;
          const categories = sale.item?.item_category || [];

          if (Array.isArray(categories) && categories.length > 0) {
            categories.forEach((cat) => {
              const categoryName = cat?.category_name || "Uncategorized";
              categoryRatios.push({ category: categoryName, ratio });
            });
          } else {
            categoryRatios.push({ category: "Uncategorized", ratio });
          }
        }
      });

      setRatioData(categoryRatios);
    } catch (err) {
      console.error("Failed to load reserve calibration data", err);
      setRatioData([]);
    } finally {
      setLoading(false);
    }
  }, [sb, sellerId]);

  useEffect(() => {
    fetchReserveData();
  }, [fetchReserveData]);

  // Realtime updates
  useEffect(() => {
    if (!sellerId) return undefined;
    const channel = sb
      .channel(`reserve-calibration-${sellerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items_sold",
          filter: `seller_id=eq.${sellerId}`,
        },
        () => fetchReserveData()
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, sellerId, fetchReserveData]);

  // Process data for box plot simulation
  const calibrationData = useMemo(() => {
    if (!ratioData.length) {
      return {
        categories: [],
        medians: [],
        q1s: [],
        q3s: [],
        mins: [],
        maxs: [],
        colors: [],
        recommendations: [],
      };
    }

    // Group ratios by category
    const categoryGroups = {};
    ratioData.forEach(({ category, ratio }) => {
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(ratio);
    });

    // Calculate statistics for each category
    const categories = [];
    const medians = [];
    const q1s = [];
    const q3s = [];
    const mins = [];
    const maxs = [];
    const colors = [];
    const recommendations = [];

    Object.entries(categoryGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, ratios]) => {
        const median = percentile(ratios, 50);
        const q1 = percentile(ratios, 25);
        const q3 = percentile(ratios, 75);
        const min = Math.min(...ratios);
        const max = Math.max(...ratios);
        const iqr = q3 - q1;

        categories.push(category);
        medians.push(median);
        q1s.push(q1);
        q3s.push(q3);
        mins.push(min);
        maxs.push(max);

        // Color based on median
        if (median < 1.05) {
          colors.push("#ef4444"); // red - too low, raise reserves
          recommendations.push("Raise reserves");
        } else if (median > 1.5) {
          colors.push("#10b981"); // green - good room, can lower
          recommendations.push("Consider lowering reserves");
        } else {
          colors.push("#3b82f6"); // blue - optimal
          recommendations.push("Optimal");
        }
      });

    return {
      categories,
      medians,
      q1s,
      q3s,
      mins,
      maxs,
      colors,
      recommendations,
    };
  }, [ratioData]);

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

  if (ratioData.length === 0) {
    return (
      <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No pricing data available. Reserve calibration will appear here once
          items are sold.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#fff' }}>
        Reserve Calibration
      </Typography>
      <Typography
        variant="body2"
        sx={{ mb: 2, fontSize: "0.875rem", color: 'var(--nav-text-muted)' }}
      >
        Distribution of final price / minimum bid ratios — optimize reserves to
        balance revenue and sell-through
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
              data: calibrationData.categories,
              label: "Category",
            },
          ]}
          yAxis={[
            {
              label: "Price / Reserve Ratio",
            },
          ]}
          series={[
            {
              data: calibrationData.medians,
              label: "Median Ratio",
              valueFormatter: (value) => `${Number(value || 0).toFixed(2)}x`,
            },
          ]}
          colors={calibrationData.colors}
          margin={{ top: 20, right: 24, bottom: 96, left: 48 }}
          slotProps={{ legend: { hidden: true } }}
          sx={{
            "& .MuiChartsAxis-tickLabel": {
              fill: '#fff',
              whiteSpace: 'nowrap',
            },
            "& .MuiChartsAxis-label": {
              fill: 'var(--theme-secondary)'
            },
            "& .MuiChartsGrid-line": {
              stroke: 'color-mix(in oklab, white 15%, transparent)'
            },
            /* >>> AXIS LINES & TICKS TO WHITE <<< */
            "& .MuiChartsAxis-bottom .MuiChartsAxis-line": { stroke: "var(--theme-gold)" }, // x-axis line
            "& .MuiChartsAxis-left .MuiChartsAxis-line": { stroke: "var(--theme-gold)" },   // y-axis line
            "& .MuiChartsAxis-tick": { stroke: "var(--theme-gold)" },
          }}
        />
      </Box>

      {/* Recommendations */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          mt: 3,
          flexWrap: "wrap",
        }}
      >
        {calibrationData.categories.map((category, index) => (
          <Box
            key={category}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              backgroundColor: `${calibrationData.colors[index]}20`,
              borderRadius: 1,
              border: `1px solid ${calibrationData.colors[index]}`,
            }}
          >
            <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 600, color: '#fff' }}>
              {category}:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "0.75rem", color: '#fff' }}>
              {calibrationData.medians[index].toFixed(2)}x
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.75rem", fontStyle: "italic", color: '#fff' }}
            >
              ({calibrationData.recommendations[index]})
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
          mt: 3,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#ef4444",
              borderRadius: "2px",
            }}
          />
          <Typography variant="body2" sx={{ fontSize: "0.875rem", color: '#fff' }}>
            Raise reserves (&lt;1.05x)
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
          <Typography variant="body2" sx={{ fontSize: "0.875rem", color: '#fff' }}>
            Optimal (1.05-1.5x)
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
          <Typography variant="body2" sx={{ fontSize: "0.875rem", color: '#fff' }}>
            Lower reserves (&gt;1.5x)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
