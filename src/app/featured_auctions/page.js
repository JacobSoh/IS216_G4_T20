'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import AuctionCard from "@/components/AuctionCard";
import AuctionCardSkeleton from "@/components/HomeAuctionSkele";
import { supabaseBrowser } from "@/utils/supabase/client";

export default function AllAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      const supabase = supabaseBrowser();

      try {
        // Fetch all auctions
        const { data: auctionData, error: auctionErr } = await supabase
          .from("auction")
          .select("aid, name, description, end_time, thumbnail_bucket, object_path");

        if (auctionErr) throw auctionErr;
        if (!auctionData || auctionData.length === 0) {
          setAuctions([]);
          return;
        }

        // Map auctions to include public image URLs
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
              endTime: new Date(a.end_time).toLocaleString(),
              picUrl
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

  return (
    <section className="min-h-screen relative pt-10 bg-gradient-to-b from-[#fff5e1] to-[#ffefea]">
      <div className="max-w-7xl mx-auto pb-15 px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
            All Auctions
          </h2>
          <p className="text-lg text-gray-600">
            Browse all ongoing auctions
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, i) => <AuctionCardSkeleton key={i} />)}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-32 text-xl font-medium text-gray-500">
            No auctions found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {auctions.map(a => (
              <Link
                key={a.aid}
                href={`/auction/${a.aid}`}
                className="block transform transition-transform hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300 rounded-lg"
              >
                <AuctionCard
                  name={a.name}
                  description={a.description}
                  picUrl={a.picUrl}
                  endTime={a.endTime}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
