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

  // Fetch 5 featured auctions for the carousel
  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      const supabase = supabaseBrowser();
      try {
        const { data: auctionData, error } = await supabase
          .from("auction")
          .select("aid, name, description, thumbnail_bucket, object_path")
          .limit(5);
        if (error) throw error;

        if (!auctionData || auctionData.length === 0) {
          setAuctions([]);
          return;
        }

        const mapped = await Promise.all(
          auctionData.map(async (a) => {
            let picUrl = null;
            if (a.thumbnail_bucket && a.object_path) {
              const { data: publicData } = supabase.storage
                .from(a.thumbnail_bucket)
                .getPublicUrl(a.object_path);
              picUrl = publicData?.publicUrl || null;
            }
            return {
              aid: a.aid,
              name: a.name,
              description: a.description,
              picUrl,
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

  // Auto-rotate carousel
  useEffect(() => {
    if (auctions.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % auctions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [auctions]);

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
        console.error(err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const getCircularIndex = (index) =>
    (index + auctions.length) % auctions.length;

  return (
    <div className="w-screen max-w-none pb-12 pt-20 space-y-20 bg-[var(--theme-primary-darker)] text-white">
      {/* ===== Main Page Title ===== */}
      <div className="text-center pt-10">
        <h1 className="text-8xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-200 via-white to-purple-300 bg-clip-text text-transparent">
          Live Auctions
        </h1>
      </div>

      {/* ===== Featured Auctions Carousel ===== */}
      <div className="px-6 lg:px-16">
        <div className="flex items-baseline justify-start gap-3 mb-15">
          <h2 className="text-3xl font-bold text-white">Popular</h2>
          <span className="text-white/70 text-3xl font-bold">
            The latest. Take a look at what’s new, now.
          </span>
        </div>
        <div className="relative w-full h-[500px] flex justify-center items-center">
          {isLoading ? (
            <BigAuctionCardSkeleton />
          ) : (
            auctions.length > 0 &&
            [-1, 0, 1].map((pos) => {
              const auctionIndex = getCircularIndex(currentIndex + pos);

              const scale = pos === 0 ? 1 : 0.75;
              const xOffset = pos * 320;
              const zIndex = pos === 0 ? 10 : 5;
              const opacity = 1;

              return (
                <motion.div
                  key={auctions[auctionIndex].aid}
                  initial={{ x: xOffset, scale, opacity }}
                  animate={{ x: xOffset, scale, opacity }}
                  exit={{ x: xOffset - 300, scale, opacity: 0 }}
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
          )}
        </div>
      </div>

      {/* ===== Categories Section ===== */}
      <div className="px-16">
        <div className="flex items-baseline justify-start gap-3 my-8">
          <h2 className="text-3xl font-bold text-white">
            <Link
              href="/categories"
              className="hover:underline hover:text-purple-300 transition"
            >
              Categories.
            </Link>
          </h2>
          <span className="text-white/70 text-3xl font-bold">
            Browse by interest & categories.
          </span>
        </div>

        {/* Define the slugify function */}
        {(() => {
          // Utility to generate clean slugs (consistent everywhere)
const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, "-")    // replace & with dash
    .replace(/[\s/+]+/g, "-")    // spaces or + -> dashes
    .replace(/[^\w-]+/g, "")     // remove other non-word chars
    .replace(/--+/g, "-")        // collapse multiple dashes
    .replace(/^-+|-+$/g, "");    // trim leading/trailing dashes
};
          return (
            <div className="overflow-x-auto flex justify-start space-x-4 px-5 py-4 scrollbar-hide">
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
                        className="h-12 px-6 rounded-full font-medium bg-purple-600/30 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
                      >
                        {cat.category_name}
                      </motion.button>
                    </Link>
                  );
                })
              )}
            </div>
          );
        })()}
      </div>

      {/* ===== Live Auctions Grid ===== */}
      <div className="px-6 lg:px-16">
        <div className="flex items-baseline justify-start gap-3 mb-10">
          <h2 className="text-3xl font-bold text-white">Live Auctions</h2>
          <span className="text-white/70 text-3xl font-bold">
            Take a look at what’s new, now.
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
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
      <div className="flex justify-center space-x-4 py-12">
        {[1, 2, 3, 4].map((page) => (
          <Link key={page} href={`/auctions/page/${page}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg bg-purple-600/30 text-white font-semibold hover:bg-purple-600 transition-shadow shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            >
              {page}
            </motion.button>
          </Link>
        ))}
      </div>
    </div>
  );
}
