"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { supabaseBrowser } from "@/utils/supabase/client";
import RecentSalesTable from "@/components/Auction/seller/recentlySold";
import CategorySalesPieChart from "@/components/Auction/seller/dashboard/CategorySalesPieChart";
import BidHeatmap from "@/components/Auction/seller/dashboard/BidHeatmap";
import PriceUpliftWaterfall from "@/components/Auction/seller/dashboard/PriceUpliftWaterfall";
import ReserveCalibration from "@/components/Auction/seller/dashboard/ReserveCalibration";
import { CustomSelect } from "@/components/Form";
import { Card, CardAction, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const axisCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return currencyFormatter.format(0);
  return currencyFormatter.format(numeric);
}

function formatCurrencyAxis(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return axisCurrencyFormatter.format(0);
  return axisCurrencyFormatter.format(numeric);
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return "—";
  }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function coerceDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeRangeStart(date) {
  if (!date) return null;
  const normalized = new Date(date.getTime());
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function normalizeRangeEnd(date) {
  if (!date) return null;
  const normalized = new Date(date.getTime());
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function isWithinInclusive(date, start, end) {
  if (!date || !start || !end) return false;
  const value = date.getTime();
  return value >= start.getTime() && value <= end.getTime();
}

function computeMedian(values = []) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function computePercentChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (Math.abs(previous) < 1e-9) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) return "0%";
  const scaled = value * 100;
  const digits = Math.abs(scaled) >= 100 ? 0 : 1;
  return `${scaled.toFixed(digits)}%`;
}

function formatPointsDelta(value) {
  if (!Number.isFinite(value)) return "0 pts";
  const magnitude = Math.abs(value);
  const digits = magnitude >= 10 ? 1 : 2;
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${magnitude.toFixed(digits)} pts`;
}

function formatPercentDelta(value) {
  if (!Number.isFinite(value)) return null;
  const magnitude = Math.abs(value);
  const digits = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : 2;
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${magnitude.toFixed(digits)}%`;
}

function ensureMap(map, key) {
  if (!map.has(key)) {
    map.set(key, new Map());
  }
  return map.get(key);
}

function ensureSet(map, key) {
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  return map.get(key);
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
  "#f6a5c0",
  "#b2df8a",
];

export default function SellerDashboard({ auctions = [] }) {
  const sb = supabaseBrowser();
  const [sellerId, setSellerId] = useState(() => auctions?.[0]?.oid ?? null);
  const [soldRows, setSoldRows] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nowRef = useMemo(() => new Date(), []);
  const [timeframe, setTimeframe] = useState("day");
  const [selectedMonth, setSelectedMonth] = useState(nowRef.getMonth());
  const [selectedYear, setSelectedYear] = useState(nowRef.getFullYear());

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
      setInventoryItems([]);
      setLoading(false);
      return;
    }
    console.info("[SellerDashboard] Fetching items_sold for seller:", sellerId);
    setLoading(true);
    setError(null);
    try {
      const [
        { data, error: soldError },
        { data: inventoryData, error: inventoryError },
      ] = await Promise.all([
        sb
          .from("items_sold")
          .select(
            "sid, final_price, sold_at, aid, iid, auction:aid(name), item:iid(title, item_category(category_name))"
          )
          .eq("seller_id", sellerId)
          .order("sold_at", { ascending: true }),
        sb
          .from("item")
          .select("iid, aid, sold, auction:aid(start_time)")
          .eq("oid", sellerId),
      ]);

      if (soldError) {
        throw soldError;
      }

      if (inventoryError) {
        throw inventoryError;
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
        categories: Array.isArray(item?.item?.item_category)
          ? item.item.item_category
            .map((category) => category?.category_name)
            .filter(Boolean)
          : [],
      }));

      const inventory = (inventoryData ?? []).map((item, index) => ({
        row_id: item.iid ?? `inventory-${index}`,
        iid: item.iid ?? null,
        aid: item.aid ?? null,
        sold: item.sold === true,
        auctionStart: item?.auction?.start_time ?? null,
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
      setInventoryItems(inventory);
    } catch (err) {
      console.error("Failed to load seller revenue data", err);
      setError(err.message ?? "Failed to load revenue data.");
      setSoldRows([]);
      setInventoryItems([]);
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

  useEffect(() => {
    if (!sellerId) return undefined;

    const channel = sb
      .channel(`seller-dashboard-items-${sellerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "item",
          filter: `oid=eq.${sellerId}`,
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

  const auctionTimeline = useMemo(() => {
    if (!auctions?.length) return new Map();
    return new Map(
      auctions
        .map((auction) => {
          const id = auction?.aid ?? auction?.id ?? null;
          if (!id) return null;
          const start =
            coerceDate(auction?.start_time ?? auction?.startTime ?? null);
          return start ? [id, start] : [id, null];
        })
        .filter(Boolean)
    );
  }, [auctions]);

  const performanceMetrics = useMemo(() => {
    const defaults = {
      sellThrough: {
        rate: 0,
        deltaPoints: 0,
        trend: "flat",
        soldCount: 0,
        totalItems: 0,
        hasPrevious: false,
      },
      price: {
        average: 0,
        median: 0,
        deltaPct: null,
        trend: "flat",
        hasPrevious: false,
        sampleSize: 0,
      },
    };

    if (!soldRows.length && !inventoryItems.length) {
      return defaults;
    }

    const soldWithDates = soldRows
      .map((row) => {
        const soldDate = coerceDate(row.sold_at);
        return {
          ...row,
          soldDate,
          finalPrice: Number(row.final_price ?? 0),
        };
      })
      .filter((row) => Boolean(row.soldDate));

    const itemsWithStart = inventoryItems
      .map((item) => {
        const explicitStart = coerceDate(item.auctionStart);
        const lookupStart = auctionTimeline.get(item.aid) ?? null;
        const startDate = explicitStart ?? coerceDate(lookupStart);
        return {
          ...item,
          startDate,
        };
      })
      .filter((item) => Boolean(item.startDate));

    const rangeCandidates = [
      ...soldWithDates.map((row) => row.soldDate),
      ...itemsWithStart.map((item) => item.startDate),
    ];

    if (!rangeCandidates.length) {
      return defaults;
    }

    const sortedDates = [...rangeCandidates].sort(
      (a, b) => a.getTime() - b.getTime()
    );

    const currentStart = normalizeRangeStart(sortedDates[0]);
    const currentEnd = normalizeRangeEnd(sortedDates[sortedDates.length - 1]);

    if (!currentStart || !currentEnd) {
      return defaults;
    }

    const daySpan = Math.max(
      1,
      Math.round((currentEnd.getTime() - currentStart.getTime()) / MS_PER_DAY) +
      1
    );

    const previousEnd = normalizeRangeEnd(
      new Date(currentStart.getTime() - MS_PER_DAY)
    );
    const previousStart = normalizeRangeStart(
      new Date(previousEnd.getTime() - (daySpan - 1) * MS_PER_DAY)
    );

    const currentSold = soldWithDates.filter((row) =>
      isWithinInclusive(row.soldDate, currentStart, currentEnd)
    );
    const previousSold = soldWithDates.filter((row) =>
      isWithinInclusive(row.soldDate, previousStart, previousEnd)
    );

    const currentItems = itemsWithStart.filter((item) =>
      isWithinInclusive(item.startDate, currentStart, currentEnd)
    );
    const previousItems = itemsWithStart.filter((item) =>
      isWithinInclusive(item.startDate, previousStart, previousEnd)
    );

    const currentSoldCount = currentSold.length;
    const currentItemCount = currentItems.length;
    const previousSoldCount = previousSold.length;
    const previousItemCount = previousItems.length;

    const sellThroughRate =
      currentItemCount > 0 ? currentSoldCount / currentItemCount : 0;
    const previousRate =
      previousItemCount > 0 ? previousSoldCount / previousItemCount : 0;
    const hasSellThroughPrevious =
      previousItemCount > 0 || previousSoldCount > 0;
    const sellThroughDeltaPoints =
      (sellThroughRate - previousRate) * 100;
    const sellThroughTrend =
      sellThroughDeltaPoints > 0
        ? "up"
        : sellThroughDeltaPoints < 0
          ? "down"
          : "flat";

    const currentPrices = currentSold
      .map((row) => row.finalPrice)
      .filter((value) => Number.isFinite(value));
    const previousPrices = previousSold
      .map((row) => row.finalPrice)
      .filter((value) => Number.isFinite(value));

    const averagePrice =
      currentPrices.length > 0
        ? currentPrices.reduce((sum, value) => sum + value, 0) /
        currentPrices.length
        : 0;
    const medianPrice = computeMedian(currentPrices);
    const previousAverage =
      previousPrices.length > 0
        ? previousPrices.reduce((sum, value) => sum + value, 0) /
        previousPrices.length
        : 0;

    const priceDeltaPct = computePercentChange(averagePrice, previousAverage);
    const hasPricePrevious = previousPrices.length > 0;
    const priceTrend =
      Number.isFinite(priceDeltaPct) && priceDeltaPct !== null
        ? priceDeltaPct > 0
          ? "up"
          : priceDeltaPct < 0
            ? "down"
            : "flat"
        : hasPricePrevious
          ? "flat"
          : "flat";

    return {
      sellThrough: {
        rate: sellThroughRate,
        deltaPoints: sellThroughDeltaPoints,
        trend: sellThroughTrend,
        soldCount: currentSoldCount,
        totalItems: currentItemCount,
        hasPrevious: hasSellThroughPrevious,
      },
      price: {
        average: averagePrice,
        median: medianPrice,
        deltaPct: priceDeltaPct,
        trend: priceTrend,
        hasPrevious: hasPricePrevious && Number.isFinite(priceDeltaPct),
        sampleSize: currentPrices.length,
      },
    };
  }, [soldRows, inventoryItems, auctionTimeline]);

  const { sellThrough, price: priceMetrics } = performanceMetrics;
  const formattedSellThroughDelta = formatPointsDelta(sellThrough.deltaPoints);
  const formattedPriceDelta = formatPercentDelta(priceMetrics.deltaPct);
  const revenueAggregation = useMemo(() => {
    const daily = new Map();
    const monthly = new Map();
    const categorySet = new Set();
    const yearSet = new Set();
    const monthsByYear = new Map();
    let totalRevenue = 0;
    let totalSold = 0;

    soldRows.forEach((row) => {
      const soldDate = coerceDate(row.sold_at);
      if (!soldDate) return;

      const price = Number(row.final_price ?? 0);
      totalRevenue += price;
      totalSold += 1;

      const year = soldDate.getFullYear();
      const month = soldDate.getMonth();
      const day = soldDate.getDate();
      yearSet.add(year);
      ensureSet(monthsByYear, year).add(month);

      const categories =
        Array.isArray(row.categories) && row.categories.length
          ? row.categories
          : ["Uncategorized"];

      categories.forEach((category) => categorySet.add(category));

      const dailyYear = ensureMap(daily, year);
      const dailyMonth = ensureMap(dailyYear, month);
      const dailyDay = ensureMap(dailyMonth, day);

      categories.forEach((category) => {
        dailyDay.set(category, (dailyDay.get(category) ?? 0) + price);
      });

      const monthlyYear = ensureMap(monthly, year);
      const monthlyMonth = ensureMap(monthlyYear, month);
      categories.forEach((category) => {
        monthlyMonth.set(category, (monthlyMonth.get(category) ?? 0) + price);
      });
    });

    return {
      totalRevenue,
      totalSold,
      daily,
      monthly,
      categories: categorySet,
      years: yearSet,
      monthsByYear,
    };
  }, [soldRows]);

  const categoryList = useMemo(() => {
    const entries = Array.from(revenueAggregation.categories ?? []);
    if (entries.length > 0) {
      return entries;
    }
    return ["Uncategorized"];
  }, [revenueAggregation.categories]);

  const categoryColorMap = useMemo(() => {
    const mapping = new Map();
    categoryList.forEach((category, index) => {
      mapping.set(category, categoryColorPalette[index % categoryColorPalette.length]);
    });
    return mapping;
  }, [categoryList]);

  const monthsWithSalesByYear = useMemo(() => {
    const map = new Map();
    revenueAggregation.monthsByYear?.forEach((set, year) => {
      if (!set || set.size === 0) return;
      const sorted = Array.from(set).sort((a, b) => a - b);
      if (sorted.length > 0) {
        map.set(year, sorted);
      }
    });
    return map;
  }, [revenueAggregation.monthsByYear]);

  const availableYears = useMemo(() => {
    const years = Array.from(monthsWithSalesByYear.keys()).sort(
      (a, b) => a - b
    );
    return years;
  }, [monthsWithSalesByYear]);

  const resolvedYear = useMemo(() => {
    if (availableYears.includes(selectedYear)) {
      return selectedYear;
    }
    if (availableYears.length > 0) {
      return availableYears[availableYears.length - 1];
    }
    return null;
  }, [availableYears, selectedYear]);

  const availableMonths = useMemo(() => {
    if (resolvedYear == null) {
      return [];
    }
    return monthsWithSalesByYear.get(resolvedYear) ?? [];
  }, [monthsWithSalesByYear, resolvedYear]);

  const resolvedMonth = useMemo(() => {
    if (availableMonths.includes(selectedMonth)) {
      return selectedMonth;
    }
    if (availableMonths.length > 0) {
      return availableMonths[availableMonths.length - 1];
    }
    return null;
  }, [availableMonths, selectedMonth]);

  useEffect(() => {
    if (!availableYears.length) return;
    setSelectedYear((prev) => {
      if (availableYears.includes(prev)) {
        return prev;
      }
      return availableYears[availableYears.length - 1];
    });
  }, [availableYears]);

  useEffect(() => {
    if (!availableMonths.length) return;
    setSelectedMonth((prev) => {
      if (availableMonths.includes(prev)) {
        return prev;
      }
      return availableMonths[availableMonths.length - 1];
    });
  }, [availableMonths]);

  const chartView = useMemo(() => {
    if (!revenueAggregation) {
      return {
        xLabels: [],
        series: [],
        isEmpty: true,
      };
    }

    const categoryTotals = new Map();
    const seriesValues = new Map();
    categoryList.forEach((category) => {
      seriesValues.set(category, []);
      categoryTotals.set(category, 0);
    });

    if (timeframe === "day") {
      if (resolvedYear == null || resolvedMonth == null) {
        return {
          xLabels: [],
          series: [],
          isEmpty: true,
          timeframe: "day",
        };
      }

      const activeYear = resolvedYear;
      const activeMonth = resolvedMonth;
      const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
      const yearMap = revenueAggregation.daily.get(activeYear);
      const monthMap = yearMap?.get(activeMonth);

      const xLabels = [];
      for (let day = 1; day <= daysInMonth; day += 1) {
        xLabels.push(day);
        const dayMap = monthMap?.get(day) ?? new Map();
        categoryList.forEach((category) => {
          const value = Number(dayMap?.get(category) ?? 0);
          seriesValues.get(category).push(Number.isFinite(value) ? value : 0);
          categoryTotals.set(
            category,
            (categoryTotals.get(category) ?? 0) + value
          );
        });
      }

      const categoriesWithRevenue = categoryList.filter(
        (category) => (categoryTotals.get(category) ?? 0) > 0
      );
      const orderedCategories = (categoriesWithRevenue.length
        ? categoriesWithRevenue
        : categoryList
      ).sort((a, b) => (categoryTotals.get(b) ?? 0) - (categoryTotals.get(a) ?? 0));

      const series = orderedCategories.map((category) => ({
        id: category,
        label: category,
        stack: "revenue",
        data: seriesValues.get(category),
        color: categoryColorMap.get(category),
        valueFormatter: (value) => formatCurrency(value),
      }));

      const hasData = orderedCategories.some(
        (category) => (categoryTotals.get(category) ?? 0) > 0
      );

      return {
        xLabels,
        xAxisLabel: `${monthNames[activeMonth]} ${activeYear}`,
        series,
        isEmpty: !hasData,
        timeframe: "day",
      };
    }

    // Month view
    if (resolvedYear == null) {
      return {
        xLabels: [],
        series: [],
        isEmpty: true,
        timeframe: "month",
      };
    }

    const activeYear = resolvedYear;
    const yearMap = revenueAggregation.monthly.get(activeYear);
    const xLabels = monthNames.map((_, index) => monthNames[index]);
    for (let month = 0; month < 12; month += 1) {
      const monthMap = yearMap?.get(month) ?? new Map();
      categoryList.forEach((category) => {
        const value = Number(monthMap?.get(category) ?? 0);
        seriesValues.get(category).push(Number.isFinite(value) ? value : 0);
        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + value
        );
      });
    }

    const categoriesWithRevenue = categoryList.filter(
      (category) => (categoryTotals.get(category) ?? 0) > 0
    );
    const orderedCategories = (categoriesWithRevenue.length
      ? categoriesWithRevenue
      : categoryList
    ).sort((a, b) => (categoryTotals.get(b) ?? 0) - (categoryTotals.get(a) ?? 0));

    const series = orderedCategories.map((category) => ({
      id: category,
      label: category,
      stack: "revenue",
      data: seriesValues.get(category),
      color: categoryColorMap.get(category),
      valueFormatter: (value) => formatCurrency(value),
    }));

    const hasData = orderedCategories.some(
      (category) => (categoryTotals.get(category) ?? 0) > 0
    );

    return {
      xLabels,
      xAxisLabel: `${activeYear}`,
      series,
      isEmpty: !hasData,
      timeframe: "month",
    };
  }, [
    revenueAggregation,
    categoryList,
    categoryColorMap,
    timeframe,
    resolvedMonth,
    resolvedYear,
  ]);

  useEffect(() => {
    console.info("[SellerDashboard] Revenue summary", {
      totalRevenue: revenueAggregation.totalRevenue,
      totalSold: revenueAggregation.totalSold,
      timeframe,
      selectedMonth: resolvedMonth,
      selectedYear: resolvedYear,
    });
  }, [
    revenueAggregation.totalRevenue,
    revenueAggregation.totalSold,
    timeframe,
    resolvedMonth,
    resolvedYear,
  ]);

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
    <div className="space-y-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant='default'>
          <CardContent>
            <p className="text-sm text-[var(--nav-text-muted)]">Lifetime Revenue</p>
            <p className="text-2xl font-semibold text-white">
              {formatCurrency(revenueAggregation.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card variant='default'>
          <CardContent>
            <p className="text-sm text-[var(--nav-text-muted)]">Items Sold</p>
            <p className="text-2xl font-semibold text-white">
              {revenueAggregation.totalSold}
            </p>
          </CardContent>
        </Card>
        <Card variant='default'>
          <CardContent>
            <p className="text-sm text-[var(--nav-text-muted)]">Sell-through Rate</p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-2xl font-semibold text-white">
                {formatPercentage(sellThrough.rate)}
              </p>
              <span className="text-xs text-[var(--nav-text-muted)]">
                {sellThrough.totalItems > 0
                  ? `${sellThrough.soldCount}/${sellThrough.totalItems} sold`
                  : "No listings"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {sellThrough.hasPrevious ? (
                <>
                  {sellThrough.trend === "up" ? (
                    <ArrowUpRight className="size-4 text-emerald-400" />
                  ) : sellThrough.trend === "down" ? (
                    <ArrowDownRight className="size-4 text-red-400" />
                  ) : (
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-500" />
                  )}
                  <span
                    className={`font-medium ${sellThrough.trend === "up"
                      ? "text-emerald-400"
                      : sellThrough.trend === "down"
                        ? "text-red-400"
                        : "text-[var(--nav-text-muted)]"
                      }`}
                  >
                    {formattedSellThroughDelta}
                  </span>
                  <span className="text-[var(--nav-text-muted)]">vs prior</span>
                </>
              ) : (
                <span className="text-[var(--nav-text-muted)]">No prior period</span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card variant='default'>
          <CardContent>
            <p className="text-sm text-[var(--nav-text-muted)]">Average Final Price</p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <p className="text-2xl font-semibold text-white">
                {formatCurrency(priceMetrics.average)}
              </p>
              <span className="text-xs text-[var(--nav-text-muted)]">
                Median {formatCurrency(priceMetrics.median)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {priceMetrics.hasPrevious && formattedPriceDelta ? (
                <>
                  {priceMetrics.trend === "up" ? (
                    <ArrowUpRight className="size-4 text-emerald-400" />
                  ) : priceMetrics.trend === "down" ? (
                    <ArrowDownRight className="size-4 text-red-400" />
                  ) : (
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-500" />
                  )}
                  <span
                    className={`font-medium ${priceMetrics.trend === "up"
                      ? "text-emerald-400"
                      : priceMetrics.trend === "down"
                        ? "text-red-400"
                        : "text-[var(--nav-text-muted)]"
                      }`}
                  >
                    {formattedPriceDelta}
                  </span>
                  <span className="text-[var(--nav-text-muted)]">vs prior</span>
                </>
              ) : (
                <span className="text-[var(--nav-text-muted)]">
                  {priceMetrics.sampleSize > 0 ? "No prior period" : "Awaiting sales"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant='default'>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
          <CardDescription>Stacked by category with smallest segments on top</CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="w-32">
                <CustomSelect
                  type="timeframe"
                  value={timeframe}
                  onChange={(event) => {
                    setTimeframe(event.target.value);
                  }}
                  options={[
                    { value: "day", label: "Daily" },
                    { value: "month", label: "Monthly" },
                  ]}
                />
              </div>
              {timeframe === "day" ? (
                <div className="w-36">
                  <CustomSelect
                    type="month"
                    value={
                      resolvedMonth != null ? String(resolvedMonth) : ""
                    }
                    disabled={availableMonths.length === 0}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isInteger(value) && value >= 0 && value <= 11) {
                        setSelectedMonth(value);
                      }
                    }}
                    options={(availableMonths.length ? availableMonths : []).map(
                      (month) => ({
                        value: String(month),
                        label: monthNames[month],
                      })
                    )}
                  />
                </div>
              ) : (
                <div className="w-32">
                  <CustomSelect
                    type="year"
                    value={
                      resolvedYear != null ? String(resolvedYear) : ""
                    }
                    disabled={availableYears.length === 0}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isNaN(value)) {
                        setSelectedYear(value);
                      }
                    }}
                    options={availableYears.map((year) => ({
                      value: String(year),
                      label: String(year),
                    }))}
                  />
                </div>
              )}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--nav-text-muted)]">Loading revenue data…</p>
          ) : chartView.isEmpty ? (
            <p className="text-sm text-[var(--nav-text-muted)]">
              No revenue recorded for {" "}
              {timeframe === "day"
                ? resolvedMonth != null && resolvedYear != null
                  ? `${monthNames[resolvedMonth]} ${resolvedYear}`
                  : "the selected month"
                : resolvedYear ?? "the selected year"}
              . Once sales occur, stacked bars will appear here.
            </p>
          ) : (
            <BarChart
              height={340}
              xAxis={[
                {
                  id: "period",
                  data: chartView.xLabels,
                  scaleType: "band",
                  label: chartView.xAxisLabel,
                },
              ]}
              yAxis={[
                {
                  valueFormatter: (value) => formatCurrencyAxis(value),
                },
              ]}
              series={chartView.series}
              margin={{ top: 16, right: 24, bottom: 40, left: 40 }}
              slotProps={{ legend: { hidden: true } }}
              sx={{
                "& .MuiChartsAxis-tickLabel": {
                  textOverflow: "initial",
                  overflow: "visible",
                  whiteSpace: "nowrap",
                  fill: "#fff",
                },
                "& .MuiChartsAxis-label": {
                  fill: "var(--theme-secondary)",
                },
                "& .MuiChartsLegend-label": {
                  fill: "#fff",
                },
                "& .MuiChartsLegend-series text": {
                  fill: "#fff",
                },
                "& .MuiChartsGrid-line": {
                  stroke: "color-mix(in oklab, white 15%, transparent)",
                },

                /* >>> AXIS LINES & TICKS TO WHITE <<< */
                "& .MuiChartsAxis-bottom .MuiChartsAxis-line": { stroke: "var(--theme-gold)" }, // x-axis line
                "& .MuiChartsAxis-left .MuiChartsAxis-line": { stroke: "var(--theme-gold)" },   // y-axis line
                "& .MuiChartsAxis-tick": { stroke: "var(--theme-gold)" },
              }}
            />
          )}
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </CardContent>
      </Card>

      <Card variant='default'>
        <CardHeader>
          <CardTitle>Category & Sales Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <CategorySalesPieChart sellerId={sellerId} />
        </CardContent>
      </Card>

      <Card variant='default'>
        <CardHeader>
          <CardTitle>Bid Heatmap</CardTitle>
          <CardDescription>Concentration of bids by hour and weekday — schedule auctions when bidders are most active</CardDescription>
        </CardHeader>
        <CardContent>
          <BidHeatmap sellerId={sellerId} />
        </CardContent>
      </Card>

      <Card variant='default'>
        <CardHeader>
          <CardTitle>
            Price-Uplift Waterfall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceUpliftWaterfall sellerId={sellerId} />
        </CardContent>
      </Card>

      <Card variant='default'>
        <CardContent>
          <ReserveCalibration sellerId={sellerId} />
        </CardContent>
      </Card>

      <RecentSalesTable soldItems={soldRows} loading={loading} />
    </div>
  );
}
