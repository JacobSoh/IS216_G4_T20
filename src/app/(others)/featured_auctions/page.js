"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabaseBrowser } from "@/utils/supabase/client";
import {
  BigAuctionCard,
  BigAuctionCardSkeleton,
  AuctionHoverPicture,
  AuctionHoverPictureSkeleton,
} from "@/components/AuctionCard";

export default function FeaturedStorePage() {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // under 1024px = "mobile/tablet"
    };
    handleResize(); // run once
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Fetch featured auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      const supabase = supabaseBrowser();
      try {
        const { data, error } = await supabase
          .from("auction")
          .select("aid, name, description, thumbnail_bucket, object_path")
          .limit(5);
        if (error) throw error;

        const mapped = await Promise.all(
          (data || []).map(async (a) => {
            const { data: publicData } = supabase.storage
              .from(a.thumbnail_bucket)
              .getPublicUrl(a.object_path);
            return {
              aid: a.aid,
              name: a.name,
              description: a.description,
              picUrl: publicData?.publicUrl || null,
            };
          })
        );

        setAuctions(mapped);
      } catch (err) {
        console.error(err);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  // ✅ Auto-rotate carousel
  useEffect(() => {
    if (auctions.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % auctions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [auctions]);

  // ✅ Fetch categories
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
        console.error(err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const getCircularIndex = (index) =>
    (index + auctions.length) % auctions.length;

  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s*&\s*/g, "-")
      .replace(/[\s/+]+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");

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
      </div>

      {/* ===== Categories Section ===== */}
      <div className="px-4 sm:px-8 lg:px-16">
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 my-8 text-center lg:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            <Link
              href="/categories"
              className="hover:underline hover:text-purple-300 transition"
            >
              Categories.
            </Link>
          </h2>
          <span className="text-white/70 text-lg sm:text-2xl font-semibold">
            Browse by interests & collections.
          </span>
        </div>

        <div className="overflow-x-auto flex justify-start gap-4 sm:gap-6 px-2 py-4 scrollbar-hide">
          {categories.length === 0 ? (
            <p className="text-purple-300">No categories found.</p>
          ) : (
            categories.map((cat) => {
              const slug = slugify(cat.category_name);
              return (
                <Link key={cat.id} href={`/categories/${slug}`}>
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(168,85,247,0.5)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="h-10 sm:h-12 px-5 sm:px-6 rounded-full font-medium bg-purple-600/30 text-white text-sm sm:text-base shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all whitespace-nowrap"
                  >
                    {cat.category_name}
                  </motion.button>
                </Link>
              );
            })
          )}
        </div>
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

      {/* ===== Pagination ===== */}
      <div className="flex justify-center flex-wrap gap-4 sm:gap-6 py-12">
        {[1, 2, 3, 4].map((page) => (
          <Link key={page} href={`/auctions/page/${page}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-purple-600/30 text-white font-semibold text-sm sm:text-base hover:bg-purple-600 transition-shadow shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            >
              {page}
            </motion.button>
          </Link>
        ))}
      </div>
    </div>
  );
}
