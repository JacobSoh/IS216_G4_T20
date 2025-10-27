'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuctionCard from "@/components/AuctionCard";
import AuctionCardSkeleton from "@/components/HomeAuctionSkele";
import { supabaseBrowser } from "@/utils/supabase/client";

// Utility to generate slug from a string
const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")       // spaces -> dashes
    .replace(/[^\w-]+/g, "")    // remove non-word chars
    .replace(/--+/g, "-");      // collapse multiple dashes
};

export default function CategoryPage() {
  const { slug } = useParams();
  const [categoryName, setCategoryName] = useState("");
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      const supabase = supabaseBrowser();

      try {
        // 1️⃣ Get all categories and find the one matching the slug
        const { data: categories, error: catErr } = await supabase
          .from("category")
          .select("category_name");

        if (catErr) throw catErr;
        if (!categories || categories.length === 0) throw new Error("No categories found");

        // Find the matching category by generated slug
        const matched = categories.find(c => slugify(c.category_name) === slug);
        if (!matched) {
          console.warn("No matching category for slug:", slug);
          setCategoryName("Unknown Category");
          setAuctions([]);
          return;
        }

        setCategoryName(matched.category_name);

        // 2️⃣ Get all item IDs in this category (items can have multiple categories)
        const { data: itemCategories, error: icErr } = await supabase
          .from("item_category")
          .select("itemid")
          .eq("category_name", matched.category_name);

        if (icErr) throw icErr;
        if (!itemCategories || itemCategories.length === 0) {
          setAuctions([]);
          return;
        }

        const itemIds = itemCategories.map(ic => ic.itemid);

        // 3️⃣ Get auctions for these items
        // Join item -> auction
        const { data: itemsData, error: itemErr } = await supabase
          .from("item")
          .select("iid, aid")
          .in("iid", itemIds);

        if (itemErr) throw itemErr;
        if (!itemsData || itemsData.length === 0) {
          setAuctions([]);
          return;
        }

        const auctionIds = [...new Set(itemsData.map(i => i.aid))]; // unique auction IDs

        const { data: auctionData, error: auctionErr } = await supabase
          .from("auction")
          .select("aid, name, description, end_time, thumbnail_bucket, object_path")
          .in("aid", auctionIds);

        if (auctionErr) throw auctionErr;
        if (!auctionData || auctionData.length === 0) {
          setAuctions([]);
          return;
        }

        // Map auctions to include public image URLs
        const mapped = await Promise.all(
          auctionData.map(async (a) => {
            let picUrl = null;
            if (a.thumbnail_bucket && a.object_path) {
              const { data: publicData } = supabase
                .storage
                .from(a.thumbnail_bucket)
                .getPublicUrl(a.object_path);
              picUrl = publicData?.publicUrl || null;
            }
            return {
              aid: a.aid,
              name: a.name,
              description: a.description,
              endTime: new Date(a.end_time).toLocaleString(),
              picUrl
            };
          })
        );

        setAuctions(mapped);
      } catch (err) {
        console.error("Category fetch error:", err);
        setCategoryName("Unknown Category");
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, [slug]);

  return (
    <section className="min-h-screen relative pt-10 bg-gradient-to-b from-[#fff5e1] to-[#ffefea]">
      <div className="max-w-7xl mx-auto pb-15 px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
            {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
          </h2>
          <p className="text-lg text-gray-600">
            Browse auctions for items in this category
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, i) => <AuctionCardSkeleton key={i} />)}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-32 text-xl font-medium text-gray-500">
            No auctions found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {auctions.map(a => (
              <Link
                key={a.aid}
                href={`/auction/${a.aid}`}
                className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 rounded-md"
              >
                <AuctionCard
                  name={a.name}
                  description={a.description}
                  picUrl={a.picUrl}
                  endTime={a.endTime}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
