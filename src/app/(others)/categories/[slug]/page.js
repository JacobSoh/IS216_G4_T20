"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AuctionCard, AuctionCardSkeleton } from "@/components/AuctionCard";
import { supabaseBrowser } from "@/utils/supabase/client";

// Utility to generate clean slugs
const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, "-")
    .replace(/[\s/+]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function CategoryPage() {
  const { slug } = useParams();
  const [categoryName, setCategoryName] = useState("");
  const [auctions, setAuctions] = useState([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);
  const [expectedCount, setExpectedCount] = useState(0); // ✅ Track how many skeletons to render

  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoadingCategory(true);
      const supabase = supabaseBrowser();

      try {
        const { data: categories, error } = await supabase
          .from("category")
          .select("category_name");

        if (error) throw error;
        if (!categories || categories.length === 0) {
          setCategoryName("Unknown Category");
          return;
        }

        const matched = categories.find(
          (c) => slugify(c.category_name) === slug.toLowerCase()
        );

        if (!matched) {
          setCategoryName("Unknown Category");
          return;
        }

        setCategoryName(matched.category_name);
      } catch (err) {
        console.error("Category fetch error:", err);
        setCategoryName("Unknown Category");
      } finally {
        setIsLoadingCategory(false);
      }
    };

    fetchCategory();
  }, [slug]);

  useEffect(() => {
    const fetchAuctions = async () => {
      if (!categoryName || categoryName === "Unknown Category") {
        setAuctions([]);
        setExpectedCount(0);
        setIsLoadingAuctions(false);
        return;
      }

      setIsLoadingAuctions(true);
      const supabase = supabaseBrowser();

      try {
        // 1️⃣ Get item IDs for this category
        const { data: itemCategories, error: icErr } = await supabase
          .from("item_category")
          .select("itemid")
          .eq("category_name", categoryName);

        if (icErr) throw icErr;
        if (!itemCategories || itemCategories.length === 0) {
          setExpectedCount(0);
          setAuctions([]);
          return;
        }

        const itemIds = itemCategories.map((ic) => ic.itemid);
        setExpectedCount(itemIds.length); // ✅ Use number of matching items as skeleton count

        // 2️⃣ Get auctions for these items
        const { data: itemsData, error: itemErr } = await supabase
          .from("item")
          .select("iid, aid")
          .in("iid", itemIds);

        if (itemErr) throw itemErr;
        if (!itemsData || itemsData.length === 0) {
          setAuctions([]);
          return;
        }

        const auctionIds = [...new Set(itemsData.map((i) => i.aid))];

        // 3️⃣ Fetch auction details
        const { data: auctionData, error: auctionErr } = await supabase
          .from("auction")
          .select(
            "aid, name, description, start_time, thumbnail_bucket, object_path"
          )
          .in("aid", auctionIds);

        if (auctionErr) throw auctionErr;
        if (!auctionData || auctionData.length === 0) {
          setAuctions([]);
          return;
        }

        // 4️⃣ Map storage URLs
        const mapped = auctionData.map((a) => {
          const { data: publicData } = supabase.storage
            .from(a.thumbnail_bucket)
            .getPublicUrl(a.object_path);

          return {
            aid: a.aid,
            name: a.name,
            description: a.description,
            start_time: new Date(a.start_time).toLocaleString(),
            picUrl: publicData?.publicUrl || null,
          };
        });

        setAuctions(mapped);
      } catch (err) {
        console.error("Auctions fetch error:", err);
        setAuctions([]);
      } finally {
        setIsLoadingAuctions(false);
      }
    };

    fetchAuctions();
  }, [categoryName]);

  return (
    <section className="min-h-screen relative pt-10 bg-[var(--theme-primary-darker)]">
      <div className="max-w-7xl mx-auto pb-15 pt-15 px-6">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-[var(--theme-cream)] min-h-[1em]">
            {isLoadingCategory
              ? "Loading..."
              : categoryName && categoryName !== "Unknown Category"
              ? categoryName
              : "Unknown Category"}
          </h2>
          <p className="text-lg text-[var(--theme-cream)]">
            Browse auctions for items in this category
          </p>
        </div>

        {/* Auctions Section */}
        {isLoadingCategory || isLoadingAuctions ? (
          // ✅ One stable row of 3 skeletons — no flicker, no wrap
          <div className="flex justify-center gap-10 py-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <AuctionCardSkeleton key={i} />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-32 text-xl font-medium text-gray-500">
            No auctions found in this category.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10">
            {auctions.map((a) => (
              <Link
                key={a.aid}
                href={`/auction/view/${a.aid}`}
                className="transform transition-transform hover:scale-105"
              >
                <AuctionCard
                  name={a.name}
                  description={a.description}
                  start_time={a.start_time}
                  picUrl={a.picUrl}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
