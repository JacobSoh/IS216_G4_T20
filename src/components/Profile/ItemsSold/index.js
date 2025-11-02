"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabaseBrowser } from "@/utils/supabase/client";
import Spinner from "@/components/SpinnerComponent";
import ItemSoldCard from "@/components/ItemSoldCard";

export default function ItemsSold({ userId }) {
  const sb = supabaseBrowser();
  const [state, setState] = useState({
    items: [],
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setState({ items: [], loading: false });
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
            setState({ items: [], loading: false });
          }
          return;
        }

        const transformed =
          data?.map((entry) => {
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
              final_price: Number(entry.final_price || 0),
              sold_at: entry.sold_at,
              picUrl,
            };
          }) ?? [];

        if (active) {
          setState({
            items: transformed.filter(Boolean),
            loading: false,
          });
        }
      } catch (err) {
        console.error("[ItemsSold] Exception:", err);
        if (active) {
          setState({ items: [], loading: false });
        }
      }
    };

    fetchItems();

    return () => {
      active = false;
    };
  }, [userId, sb]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="md" className="text-[var(--theme-primary)]" />
      </div>
    );
  }

  if (!state.items.length) {
    return (
      <div className="py-20 text-center text-[var(--theme-muted)]">
        <p className="text-xl">No items sold yet</p>
      </div>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {state.items.map((item) => (
        <Link
          key={item.sid}
          href={item.aid ? `/auction/view/${item.aid}` : "#"}
          className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary)]/40"
        >
          <ItemSoldCard {...item} />
        </Link>
      ))}
    </div>
  );
}
