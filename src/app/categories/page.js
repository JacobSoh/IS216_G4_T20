'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import AuctionCard from "@/components/AuctionCard";
import AuctionCardSkeleton from "@/components/HomeAuctionSkele";
import { supabaseBrowser } from "@/utils/supabase/client";

// Utility to generate a slug from category name
const slugify = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-");

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const featuredRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const supabase = supabaseBrowser();

        // Fetch all categories from Supabase
        const { data, error } = await supabase
          .from("category")
          .select("id, category_name, description, poop_bucket, object_path");

        if (error) throw error;

        if (!data || data.length === 0) {
          setCategories([]);
          return;
        }

        // Map categories and generate slug dynamically
        const mapped = await Promise.all(
          data.map(async (c) => {
            let picUrl = null;
            if (c.poop_bucket && c.object_path) {
              const { data: publicData } = supabase
                .storage
                .from(c.poop_bucket)
                .getPublicUrl(c.object_path);
              picUrl = publicData?.publicUrl || null;
            }

            return {
              id: c.id,
              name: c.category_name,
              slug: slugify(c.category_name), // dynamically generate
              description: c.description,
              picUrl,
              buttonText: "Explore Category", // optional dynamic button text
              hideButton: false
            };
          })
        );

        setCategories(mapped);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section
      ref={featuredRef}
      className="min-h-screen relative pt-10 bg-[#0f1419]"
    >
      <div className="max-w-7xl mx-auto pb-15 px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-[#33A1E0]">Categories</h2>
          <p className="text-lg text-[#33A1E0]">Browse categories to find items of your interest</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading
            ? Array.from({ length: 15 }).map((_, i) => (
                <AuctionCardSkeleton key={`skeleton-${i}`} />
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id} // use id as unique key
                  href={`/categories/${cat.slug}`} // use dynamic slug
                  className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 rounded-lg"
                >
                  <AuctionCard
                    name={cat.name}
                    description={cat.description}
                    picUrl={cat.picUrl}
                    buttonText={cat.buttonText} // dynamic button text
                  />
                </Link>
              ))
          }
        </div>
      </div>
    </section>
  );
}
