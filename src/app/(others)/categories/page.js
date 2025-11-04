'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { CategoryCard } from "@/components/AuctionCard";
import { supabaseBrowser } from "@/utils/supabase/client";

// Utility: Convert category name → slug
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

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const featuredRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = supabaseBrowser();
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("category")
          .select("id, category_name, description, poop_bucket, object_path");

        if (error) throw error;

        if (!data || data.length === 0) {
          setCategories([]);
          return;
        }

        const mapped = data.map((c) => {
          const { data: publicData } = supabase
            .storage
            .from(c.poop_bucket)
            .getPublicUrl(c.object_path);

          return {
            id: c.id,
            name: c.category_name,
            slug: slugify(c.category_name),
            description: c.description,
            picUrl: publicData?.publicUrl || null,
          };
        });

        setCategories(mapped);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section ref={featuredRef} className="min-h-screen relative pt-10 bg-[var(--theme-primary-darker)] text-white">
      <div className="max-w-7xl mx-auto pb-20 px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-[var(--theme-cream)]">
            Categories
          </h2>
          <p className="text-lg text-[var(--theme-cream)]">
            Browse categories to find items of your interest
          </p>
        </div>

        {/* Category Grid (5 per row) */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <CategoryCard key={`cat-skeleton-${i}`} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-32 text-xl font-medium text-gray-400">
            No categories found.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-10">
  {isLoading
    ? Array.from({ length: 10 }).map((_, i) => (
        <AuctionHoverPictureSkeleton key={`cat-skeleton-${i}`} />
      ))
    : categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.slug}`}
          className="transform transition-transform hover:scale-105 focus:scale-105"
        >
          <CategoryCard
            name={cat.name}
            picUrl={cat.picUrl}
          />
        </Link>
      ))
  }
</div>

        )}
      </div>
    </section>
  );
}
