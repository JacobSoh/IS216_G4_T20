"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import AuctionCard from "@/components/AuctionCard";
import AuctionCardSkeleton from "@/components/HomeAuctionSkele";
import { supabaseBrowser } from "@/utils/supabase/client";

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const featuredRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from("category")
          .select("category_name, description, thumbnail_bucket, object_path");

        if (error) {
          console.error("❌ Supabase error:", error.message);
          return;
        }

        if (!data || data.length === 0) {
          console.warn("⚠️ No category data found.");
          return;
        }

        // Map each category to include the public image URL
        const mapped = await Promise.all(
          data.map(async (c) => {
            let publicUrl = null;

            if (c.thumbnail_bucket && c.object_path) {
              const { data: publicData } = supabase
                .storage
                .from(c.thumbnail_bucket)
                .getPublicUrl(c.object_path);

              publicUrl = publicData?.publicUrl || null;
            }

            return {
              name: c.category_name,
              description: c.description,
              picUrl: publicUrl,
            };
          })
        );

        setCategories(mapped);
      } catch (err) {
        console.error("⚠️ Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section
      ref={featuredRef}
      className="min-h-screen relative pt-10 bg-gradient-to-b from-[#fff5e1] to-[#ffefea]"
    >
      <div className="max-w-7xl mx-auto pb-15 px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
            Categories
          </h2>
          <p className="text-lg text-gray-600">
            Browse categories to find items of your interest
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading
            ? Array.from({ length: 15 }).map((_, i) => (
                <AuctionCardSkeleton key={i} />
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 rounded-lg"
                >
                  <AuctionCard
                    name={cat.name}
                    description={cat.description}
                    picUrl={cat.picUrl}
                  />
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
    