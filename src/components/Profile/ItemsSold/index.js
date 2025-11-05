"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { supabaseBrowser } from "@/utils/supabase/client";
import Spinner from "@/components/SpinnerComponent";
import ItemSoldCard from "@/components/ItemSoldCard";
import { Slider } from "@/components/ui/slider";
import { CustomSelect } from "@/components/Form";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter

} from "@/components/ui/card";


function normalizePrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}

export default function ItemsSold({ userId }) {
  const sb = supabaseBrowser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priceBounds, setPriceBounds] = useState([0, 0]);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchItems = async () => {
      try {
        const { data, error } = await sb
          .from("items_sold")
          .select(
            `
              sid,
              final_price,
              sold_at,
              aid,
              item:iid(
                iid,
                title,
                description,
                item_bucket,
                object_path
              ),
              auction:aid(
                aid,
                name
              )
            `
          )
          .eq("seller_id", userId)
          .order("sold_at", { ascending: false });

        if (error) {
          console.error("[ItemsSold] Error fetching items_sold:", error);
          if (active) {
            setItems([]);
            setLoading(false);
          }
          return;
        }

        const baseItems =
          data
            ?.map((entry) => {
              if (!entry?.item) return null;
              const objectPath = entry.item.object_path;
              const bucket = entry.item.item_bucket || "item";
              const picUrl = objectPath
                ? sb.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl
                : null;
              return {
                sid: entry.sid,
                iid: entry.item.iid,
                aid: entry.auction?.aid,
                auctionName: entry.auction?.name,
                title: entry.item.title,
                description: entry.item.description,
                final_price: normalizePrice(entry.final_price),
                sold_at: entry.sold_at,
                picUrl,
              };
            })
            .filter(Boolean) ?? [];

        const itemIds = baseItems.map((item) => item.iid).filter(Boolean);
        let categoriesMap = new Map();
        if (itemIds.length > 0) {
          const { data: categoriesData, error: categoriesError } = await sb
            .from("item_category")
            .select("itemid, category_name")
            .in("itemid", itemIds);

          if (categoriesError) {
            console.error("[ItemsSold] Failed to fetch categories:", categoriesError);
          } else {
            categoriesMap = categoriesData.reduce((map, row) => {
              const list = map.get(row.itemid) ?? [];
              list.push(row.category_name);
              map.set(row.itemid, list);
              return map;
            }, new Map());
          }
        }

        const enriched = baseItems.map((item) => ({
          ...item,
          categories: categoriesMap.get(item.iid) ?? [],
        }));

        if (active) {
          setItems(enriched);
          setLoading(false);

          const prices = enriched.map((item) => item.final_price);
          if (prices.length > 0) {
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            setPriceBounds([min, max]);
            setPriceRange([min, max]);
          } else {
            setPriceBounds([0, 0]);
            setPriceRange([0, 0]);
          }

          setCategoryFilter("all");
        }
      } catch (err) {
        console.error("[ItemsSold] Exception:", err);
        if (active) {
          setItems([]);
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      active = false;
    };
  }, [userId, sb]);

  const uniqueCategories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      (item.categories || []).forEach((category) => set.add(category));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const withinCategory =
        categoryFilter === "all" ||
        (item.categories || []).includes(categoryFilter);
      const price = item.final_price;
      const withinPrice =
        price >= priceRange[0] && price <= priceRange[1];
      return withinCategory && withinPrice;
    });
  }, [items, categoryFilter, priceRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="md" className="text-[var(--theme-primary)]" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-20 text-center text-[var(--theme-muted)]">
        <p className="text-xl">No items sold yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="max-w-xs w-full">
            <CustomSelect
              type="soldCategoryFilter"
              label="Category"
              placeholder="All categories"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              options={[
                { value: "all", label: "All categories" },
                ...uniqueCategories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-[var(--theme-muted)]">
              <span>Price range</span>
              <span className="font-semibold text-[var(--theme-surface-contrast)]">
                ${priceRange[0].toFixed(2)} - ${priceRange[1].toFixed(2)}
              </span>
            </div>
            <Slider
              min={priceBounds[0]}
              max={priceBounds[0] === priceBounds[1] ? priceBounds[1] + 1 : priceBounds[1]}
              step={1}
              value={priceRange}
              onValueChange={(value) => {
                if (Array.isArray(value) && value.length === 2) {
                  const lower = Math.min(value[0], value[1]);
                  const upper = Math.max(value[0], value[1]);
                  setPriceRange([
                    Math.max(priceBounds[0], lower),
                    Math.min(priceBounds[1], upper),
                  ]);
                }
              }}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {filteredItems.length === 0 ? (
        <div className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-center text-[var(--theme-muted)]">
          No sales match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <Link
              key={item.sid}
              href={item.aid ? `/auction/view/${item.aid}` : "#"}
              className="block h-full focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary)]/40"
            >
              <ItemSoldCard {...item} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
