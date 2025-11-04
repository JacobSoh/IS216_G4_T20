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
    <div className="w-full overflow-x-hidden pb-16 pt-20 space-y-20 bg-[var(--theme-primary-darker)] text-white">
      {/* ===== Header ===== */}
      <div className="text-center px-4">
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 bg-gradient-to-r from-purple-200 via-white to-purple-300 bg-clip-text text-transparent">
          Live Auctions
        </h1>
      </div>

      {/* ===== Featured Carousel ===== */}
      <div className="px-4 sm:px-8 lg:px-16">
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Popular</h2>
          <span className="text-white/70 text-lg sm:text-2xl font-semibold">
            The latest. See what’s new, now.
          </span>
        </div>

        {/* ✅ Responsive Carousel */}
        <div className="relative w-full h-[350px] sm:h-[450px] md:h-[500px] flex justify-center items-center">
          {isLoading ? (
            <BigAuctionCardSkeleton />
          ) : auctions.length > 0 ? (
            isMobile ? (
              // === Single card view (mobile / tablet)
              <motion.div
                key={auctions[currentIndex].aid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="absolute cursor-pointer"
              >
                <Link href={`/auction/${auctions[currentIndex].aid}`}>
                  <BigAuctionCard {...auctions[currentIndex]} />
                </Link>
              </motion.div>
            ) : (
              // === 3-card layout (desktop)
              [-1, 0, 1].map((pos) => {
                const auctionIndex = getCircularIndex(currentIndex + pos);
                const scale = pos === 0 ? 1 : 0.75;
                const xOffset = pos * 320;
                const zIndex = pos === 0 ? 10 : 5;
                const opacity = pos === 0 ? 1 : 0.8;

                return (
                  <motion.div
                    key={auctions[auctionIndex].aid}
                    initial={{ x: xOffset, scale, opacity }}
                    animate={{ x: xOffset, scale, opacity }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute cursor-pointer"
                    style={{ zIndex }}
                  >
                    <Link href={`/auction/${auctions[auctionIndex].aid}`}>
                      <BigAuctionCard {...auctions[auctionIndex]} />
                    </Link>
                  </motion.div>
                );
              })
            )
          ) : (
            <p className="text-white/60">No featured auctions found.</p>
          )}
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

      {/* ===== Live Auctions Grid ===== */}
      <div className="px-4 sm:px-8 lg:px-16">
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-10 text-center lg:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Live Auctions
          </h2>
          <span className="text-white/70 text-lg sm:text-2xl font-semibold">
            Explore what's trending right now.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 justify-items-center">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <AuctionHoverPictureSkeleton key={i} />
              ))
            : auctions.slice(0, 6).map((a) => (
                <Link key={a.aid} href={`/auction/${a.aid}`}>
                  <AuctionHoverPicture name={a.name} picUrl={a.picUrl} />
                </Link>
              ))}
        </div>
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
