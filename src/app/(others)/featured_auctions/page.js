'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/utils/supabase/client";
import { BigAuctionCard, BigAuctionCardSkeleton, AuctionHoverPicture, AuctionHoverPictureSkeleton } from "@/components/AuctionCard";

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      const supabase = supabaseBrowser();
      try {
        const { data: auctionData, error: auctionErr } = await supabase
          .from("auction")
          .select("aid, name, description, start_time, thumbnail_bucket, object_path");
        if (auctionErr) throw auctionErr;
        if (!auctionData || auctionData.length === 0) {
          setAuctions([]);
          return;
        }

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
              endTime: a.end_time,
              picUrl,
            };
          })
        );

        setAuctions(mapped);
      } catch (err) {
        console.error("Fetch auctions error:", err);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = supabaseBrowser();
      try {
        const { data, error } = await supabase
          .from("category")
          .select("id, category_name");
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Auto-slide top carousel every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (auctions.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % auctions.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [auctions]);

  return (
    <div className="space-y-12 px-6 lg:px-8 py-12 bg-gray-900 min-h-screen text-white">

      {/* Popular Right Now Header */}
      <h2 className="text-4xl font-extrabold text-white mb-8 -mt-5">Popular Right Now</h2>

      {/* Top Big Auction Carousel */}
      {!isLoading && auctions.length > 0 ? (
        <Link href={`/auction/view/${auctions[currentIndex].aid}`}>
          <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden cursor-pointer">
            <BigAuctionCard
              key={auctions[currentIndex].aid}
              name={auctions[currentIndex].name}
              description={auctions[currentIndex].description}
              picUrl={auctions[currentIndex].picUrl}
              endTime={auctions[currentIndex].endTime}
            />
          </div>
        </Link>
      ) : (
        <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden">
          <BigAuctionCardSkeleton key="big-auction-skeleton" />
        </div>
      )}

      {/* Categories Header */}
      <h2 className="text-4xl font-extrabold text-white my-7">Categories</h2>

      {/* Category Carousel */}
      <div className="overflow-x-auto flex space-x-4 my-5 px-4 py-4 scrollbar-hide">
        {categories.length === 0 ? (
          <p className="text-purple-300 px-4">No categories found.</p>
        ) : (
          categories.map((cat) => {
            const slug = cat.slug || cat.category_name.toLowerCase().replace(/\s+/g, "-");

            return (
              <Link
                key={cat.id}
                href={`/categories/${slug}`}
              >
                <button
                  className="flex-none w-[30vh] px-6 py-3 rounded-full text-white font-semibold 
                       hover:bg-purple-600/50 bg-purple-600/30
                       shadow-[0_0_15px_rgba(168,85,247,0.5)] transition"
                >
                  {cat.category_name}
                </button>
              </Link>
            );
          })
        )}
      </div>

      {/* Live Auctions Header */}
      <h2 className="text-4xl font-extrabold text-white my-7">Live Auctions</h2>

      {/* Auctions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <AuctionHoverPictureSkeleton key={`skeleton-grid-${i}`} />
          ))
          : auctions.slice(0, 6).map((a) => (
            <Link key={a.aid} href={`/auction/view/${a.aid}`} className="block">
              <AuctionHoverPicture
                name={a.name}
                picUrl={a.picUrl}
              />
            </Link>
          ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-3 mt-8">
        {[1, 2, 3, 4].map((page) => (
          <button
            key={`page-${page}`}
            className="px-4 py-2 rounded-lg bg-purple-600/30 text-white font-semibold hover:bg-purple-600 
                       transition-shadow shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}
