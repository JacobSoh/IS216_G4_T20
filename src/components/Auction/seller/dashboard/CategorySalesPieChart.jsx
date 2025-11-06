"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import useMediaQuery from "@mui/material/useMediaQuery";
import { supabaseBrowser } from "@/utils/supabase/client";
import { getCategoryColor } from "./categoryColors";

export default function CategorySalesPieChart({ sellerId }) {
  const sb = supabaseBrowser();
  const isSmallScreen = useMediaQuery('(max-width:640px)');
  const [loading, setLoading] = useState(true);
  const [itemsData, setItemsData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryColors, setCategoryColors] = useState({});

  // Fetch items data
  const fetchItemsData = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: allItems, error: itemsError } = await sb
        .from("item")
        .select(
          `
          iid,
          aid,
          sold,
          item_category(category_name),
          oid
        `
        )
        .eq("oid", sellerId);

      if (itemsError) throw itemsError;

      const { data: soldEntries, error: soldError } = await sb
        .from("items_sold")
        .select("iid, seller_id")
        .eq("seller_id", sellerId);

      if (soldError) throw soldError;

      const soldItemIds = new Set(
        (soldEntries ?? [])
          .map((entry) => entry?.iid)
          .filter((iid) => typeof iid === "string" || typeof iid === "number")
      );

      const data = Array.isArray(allItems) ? allItems : [];

      // Flatten categories
      const processedData = [];
      const uniqueCategories = new Set();

      data.forEach((item) => {
        if (Array.isArray(item.item_category) && item.item_category.length) {
          item.item_category.forEach((cat) => {
            const categoryName = cat?.category_name || "Uncategorized";
            uniqueCategories.add(categoryName);
            processedData.push({
              category: categoryName,
              sold: soldItemIds.has(item.iid) ? "Yes" : "No",
            });
          });
        } else {
          uniqueCategories.add("Uncategorized");
          processedData.push({
            category: "Uncategorized",
            sold: soldItemIds.has(item.iid) ? "Yes" : "No",
          });
        }
      });

      const categoriesArray = Array.from(uniqueCategories).sort();
      setCategories(categoriesArray);
      setItemsData(processedData);

      // Assign colors
      const colors = {};
      categoriesArray.forEach((cat) => {
        colors[cat] = getCategoryColor(cat);
      });
      setCategoryColors(colors);
    } catch (err) {
      console.error("Failed to load items data", err);
      setItemsData([]);
    } finally {
      setLoading(false);
    }
  }, [sb, sellerId]);

  useEffect(() => {
    fetchItemsData();
  }, [fetchItemsData]);

  // Realtime updates
  useEffect(() => {
    if (!sellerId) return undefined;
    const channel = sb
      .channel(`category-sales-items-${sellerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "item", filter: `oid=eq.${sellerId}` },
        () => fetchItemsData()
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, sellerId, fetchItemsData]);

  useEffect(() => {
    if (!sellerId) return undefined;
    const channel = sb
      .channel(`category-sales-items_sold-${sellerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items_sold", filter: `seller_id=eq.${sellerId}` },
        () => fetchItemsData()
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, sellerId, fetchItemsData]);

  // Chart data
  const { categoryData, categorySalesData, totalCount } =
    useMemo(() => {
      const total = itemsData.length;

      // Category counts
      const categoryCount = {};
      itemsData.forEach((item) => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });

      // Inner ring (category view)
      const catData = categories.map((category) => {
        const count = categoryCount[category] || 0;
        return {
          id: category,
          label: category,
          value: count,
          percentage: total > 0 ? (count / total) * 100 : 0,
          color: categoryColors[category],
        };
      });

      // Outer ring (category view): sold/not sold per category
      const catSalesData = categories.flatMap((category, catIndex) => {
        const categoryTotal = categoryCount[category] || 0;
        const baseColor = categoryColors[category];

        const soldCount = itemsData.filter(
          (item) => item.category === category && item.sold === "Yes"
        ).length;
        const notSoldCount = categoryTotal - soldCount;

        return [
          {
            id: `${category}-Yes`,
            label: "", // no legend entry
            value: soldCount,
            categoryTotal,
            percentage: categoryTotal > 0 ? (soldCount / categoryTotal) * 100 : 0,
            color: baseColor,
            series: "outer-category",
          },
          {
            id: `${category}-No`,
            label: "", // no legend entry
            value: notSoldCount,
            categoryTotal,
            percentage:
              categoryTotal > 0 ? (notSoldCount / categoryTotal) * 100 : 0,
            color: `${baseColor}80`, // dimmed
            series: "outer-category",
          },
        ];
      });

      return {
        categoryData: catData,
        categorySalesData: catSalesData,
        totalCount: total,
      };
    }, [itemsData, categories, categoryColors]);

  const innerRadius = isSmallScreen ? 30 : 50;
  const middleRadius = isSmallScreen ? 90 : 120;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (totalCount === 0) {
    return (
      <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
        <Typography variant="body1" sx={{ color: 'var(--nav-text-muted)' }}>
          No items found. Create items to see category and sales distribution.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Box sx={{ display: "flex", justifyContent: "center", height: 400 }}>
          <PieChart
            series={[
              {
                // INNER: categories — appears in legend
                innerRadius,
                outerRadius: middleRadius,
                data: categoryData,
                valueFormatter: ({ value }) =>
                  `${value} out of ${totalCount} (${((value / totalCount) * 100).toFixed(0)}%)`,
                highlightScope: { fade: "global", highlight: "item" },
                highlighted: { additionalRadius: 2 },
                cornerRadius: 3,
              },
              {
                // OUTER: sold/not sold per category — no legend entries
                innerRadius: middleRadius,
                outerRadius: middleRadius + 20,
                data: categorySalesData.filter((item) => item.value > 0),
                valueFormatter: (item) => {
                  const status = item.id.endsWith("-Yes") ? "Sold" : "Not Sold";
                  const total = item.categoryTotal || 0;
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                  return `${status} ${item.value} out of ${total} (${percentage}%)`;
                },
                highlightScope: { fade: "global", highlight: "item" },
                highlighted: { additionalRadius: 2 },
                cornerRadius: 3,
              },
            ]}
            slotProps={{
              legend: {
                hidden: true,
              },
            }}
            sx={{
              "& .MuiChartsLegend-label": { fill: '#fff' },
              "& .MuiChartsTooltip-root": {
                "& .MuiChartsTooltip-table": {
                  color: '#fff'
                }
              },
            }}
          />
      </Box>

      {/* Custom legend for categories only */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mt: 2,
        }}
      >
        {categoryData.map((category) => (
          <Box
            key={category.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                backgroundColor: category.color,
                borderRadius: "2px",
              }}
            />
            <Typography variant="body2" sx={{ fontSize: "0.875rem", color: '#fff' }}>
              {category.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
