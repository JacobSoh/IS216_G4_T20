"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { supabaseBrowser } from "@/utils/supabase/client";

// Category palette
const categoryColorPalette = [
  "#fa938e",
  "#98bf45",
  "#51cbcf",
  "#d397ff",
  "#ffc658",
  "#ff8042",
  "#8dd1e1",
  "#d0ed57",
  "#a4de6c",
  "#83a6ed",
];

export default function CategorySalesPieChart({ sellerId }) {
  const sb = supabaseBrowser();
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

      // Group by auction
      const itemsByAuction = new Map();
      allItems?.forEach((item) => {
        if (!item.aid) return;
        if (!itemsByAuction.has(item.aid)) itemsByAuction.set(item.aid, []);
        itemsByAuction.get(item.aid).push(item);
      });

      // Finished auctions: all items sold != null
      const finishedAuctionIds = new Set();
      itemsByAuction.forEach((items, auctionId) => {
        const allProcessed = items.every((it) => it.sold !== null);
        if (allProcessed) finishedAuctionIds.add(auctionId);
      });

      const data =
        allItems?.filter((item) => finishedAuctionIds.has(item.aid)) || [];

      // Flatten categories
      const processedData = [];
      const uniqueCategories = new Set();

      data?.forEach((item) => {
        if (Array.isArray(item.item_category) && item.item_category.length) {
          item.item_category.forEach((cat) => {
            const categoryName = cat?.category_name || "Uncategorized";
            uniqueCategories.add(categoryName);
            processedData.push({
              category: categoryName,
              sold: item.sold ? "Yes" : "No",
            });
          });
        } else {
          uniqueCategories.add("Uncategorized");
          processedData.push({
            category: "Uncategorized",
            sold: item.sold ? "Yes" : "No",
          });
        }
      });

      const categoriesArray = Array.from(uniqueCategories).sort();
      setCategories(categoriesArray);
      setItemsData(processedData);

      // Assign colors
      const colors = {};
      categoriesArray.forEach((cat, index) => {
        colors[cat] = categoryColorPalette[index % categoryColorPalette.length];
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

  const innerRadius = 50;
  const middleRadius = 120;

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
        <Typography variant="body1" color="text.secondary">
          No items found. Create items to see category and sales distribution.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Category & Sales Distribution
      </Typography>

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
            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
              {category.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
