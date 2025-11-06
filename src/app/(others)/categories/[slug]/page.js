"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AuctionCard } from "@/components/AuctionCard";
import { supabaseBrowser } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowBigLeft } from "lucide-react";

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
  const [fetchError, setFetchError] = useState(null);

  // Fetch category name
  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoadingCategory(true);
      const supabase = supabaseBrowser();

      try {
        const { data: categories, error } = await supabase
          .from("category")
          .select("category_name");
        if (error) throw error;

        const matched = categories?.find(
          (c) => slugify(c.category_name) === slug.toLowerCase()
        );
        setCategoryName(matched?.category_name || "Unknown Category");
      } catch (err) {
        console.error("Category fetch error:", err);
        setCategoryName("Unknown Category");
      } finally {
        setIsLoadingCategory(false);
      }
    };

    fetchCategory();
  }, [slug]);

  // Fetch auctions for this category
  useEffect(() => {
    const fetchAuctions = async () => {
      if (!categoryName || categoryName === "Unknown Category") {
        setAuctions([]);
        setIsLoadingAuctions(false);
        return;
      }

      setIsLoadingAuctions(true);
      setFetchError(null);
      const supabase = supabaseBrowser();

      try {
        console.log("Fetching auctions for category:", categoryName);

        // 1️⃣ Get item IDs for this category
        const { data: itemCategories, error: icErr } = await supabase
          .from("item_category")
          .select("itemid")
          .eq("category_name", categoryName);
        if (icErr) throw icErr;
        const itemIds = itemCategories?.map((ic) => ic.itemid) || [];
        console.log("Item IDs:", itemIds);

        if (!itemIds.length) {
          console.warn("No items found for this category.");
          setAuctions([]);
          return;
        }

        // 2️⃣ Get auction IDs for these items
        const { data: itemsData, error: itemErr } = await supabase
          .from("item")
          .select("iid, aid")
          .in("iid", itemIds);
        if (itemErr) throw itemErr;

        // Filter out null aids
        const auctionIds = [
          ...new Set(itemsData?.map((i) => i.aid).filter(Boolean)),
        ];
        console.log("Auction IDs (non-null):", auctionIds);

        if (!auctionIds.length) {
          console.warn("No valid auctions found for these items.");
          setAuctions([]);
          return;
        }

        // 3️⃣ Fetch auction details (including owner profile via foreign key)
        const { data: auctionData, error: auctionErr } = await supabase
          .from("auction")
          .select(
            `
          aid,
          oid,
          name,
          description,
          start_time,
          thumbnail_bucket,
          object_path,
          owner:profile!auction_oid_fkey (
            id,
            username,
            avatar_bucket,
            object_path
          )
        `
          )
          .in("aid", auctionIds);

        if (auctionErr) {
          console.error("Supabase auction fetch error:", auctionErr);
          setFetchError(
            "Unable to fetch auctions. Please check permissions or RLS policies."
          );
          setAuctions([]);
          return;
        }

        if (!auctionData?.length) {
          console.warn("No auction data returned.");
          setAuctions([]);
          return;
        }

        console.log("Fetched auction data:", auctionData);

        // 4️⃣ Map storage URLs safely
        const mapped = auctionData.map((a) => {
          let picUrl = null;
          if (a.thumbnail_bucket && a.object_path) {
            const { data: publicData } = supabase.storage
              .from(a.thumbnail_bucket)
              .getPublicUrl(a.object_path);
            picUrl = publicData?.publicUrl || null;
          }

          // 👤 Owner avatar URL
          let ownerAvatar = null;
          if (a.owner?.avatar_bucket && a.owner?.object_path) {
            const { data: avatarData } = supabase.storage
              .from(a.owner.avatar_bucket)
              .getPublicUrl(a.owner.object_path);
            ownerAvatar = avatarData?.publicUrl || null;
          }

          return {
            aid: a.aid,
            name: a.name,
            description: a.description,
            start_time: new Date(a.start_time).toLocaleString(),
            picUrl,
            owner: {
              username: a.owner?.username || "Unknown",
              avatar: ownerAvatar,
            },
          };
        });

        setAuctions(mapped);
      } catch (err) {
        console.error("Unexpected auction fetch error:", err);
        setFetchError("An unexpected error occurred while fetching auctions.");
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
        {/* Back Button */}
        <Button
          variant="brand"
          className="absolute top-6 left-6 " // horizontal: 4, vertical: 2 (Tailwind)
          onClick={() => {
            window.location.href = "/categories";
          }}
        >
          <ArrowBigLeft className="w-12 h-12" />{" "}
          {/* adjust icon size separately */}
        </Button>

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
          <div className="flex justify-center items-center py-32">
            <div className="w-16 h-16 border-4 border-t-transparent border-[var(--theme-cream)] rounded-full animate-spin"></div>
          </div>
        ) : fetchError ? (
          <div className="text-center py-32 text-xl font-medium text-red-500">
            {fetchError}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-32 text-xl font-medium text-gray-500">
            No auctions found in this category.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10">
            {auctions.map((a) => (
              <AuctionCard
                key={a.aid}
                name={a.name}
                owner={a.owner} // Pass the full owner object
                description={a.description}
                start_time={a.start_time}
                picUrl={a.picUrl}
                auctionLink={`/auction/view/${a.aid}`} // optional: pass link if card handles it internally
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
