"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import AuctionCard from "@/components/AuctionCard";
import AuctionCardSkeleton from "@/components/HomeAuctionSkele";
import { supabaseBrowser } from "../utils/supabase/client";

export default function FeaturedAuctions() {
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const featuredRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const supabase = supabaseBrowser();

        const { data, error } = await supabase
          .from("auction")
          .select("aid, name, description, end_time, thumbnail_bucket, object_path");

        if (error) {
          console.error("❌ Supabase error:", error.message);
          return;
        }

        if (!data || data.length === 0) {
          console.warn("⚠️ No auction data found.");
          return;
        }

        // Map each auction to include the public image URL
        const mapped = await Promise.all(
          data.map(async (a) => {
            let publicUrl = null;

            if (a.thumbnail_bucket && a.object_path) {
              const { data: publicData } = supabase
                .storage
                .from(a.thumbnail_bucket)
                .getPublicUrl(a.object_path);

              publicUrl = publicData?.publicUrl || null;
            }

            return {
              aid: a.aid,
              name: a.name,
              description: a.description,
              endTime: new Date(a.end_time).toLocaleString(),
              picUrl: publicUrl,
            };
          })
        );

        setFeaturedAuctions(mapped);
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
            Featured Auctions
          </h2>
          <p className="text-lg text-gray-600">
            Discover our handpicked selection of premium items available now
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading
            ? Array.from({ length: 25 }).map((_, i) => (
                <AuctionCardSkeleton key={i} />
              ))
            : featuredAuctions.map((a, i) => (
                <Link
                  key={i}
                  href={`/auction/${a.aid}`}
                  className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 rounded-lg"
                >
                  <AuctionCard {...a} />
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
