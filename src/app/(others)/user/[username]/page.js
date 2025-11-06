"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import {
  Avatar,
  Stats,
  AvgReview,
  Options,
} from "@/components/Profile";
import Auctions from "@/components/Profile/Auctions";
import ItemsSold from "@/components/Profile/ItemsSold";
import ReviewWithComposer from "@/components/Profile/Review/ReviewWithComposer.jsx";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Button } from "@/components/ui/button";
import { Spinner as UISpinner } from "@/components/ui/spinner";
import { ShieldCheckIcon } from "lucide-react";

import { getAvatarPublicUrl } from "@/hooks/getStorage";
import { supabaseBrowser } from "@/utils/supabase/client";
import getTimeAgo from "@/utils/profile/getTimeAgo";

async function fetchPublicProfile(sb, username) {
  const { data: profileRow, error: profileError } = await sb
    .from("profile")
    .select(
      `
        id,
        username,
        first_name,
        middle_name,
        last_name,
        address,
        avatar_bucket,
        object_path,
        created_at,
        verified
      `
    )
    .eq("username", username)
    .single();

  if (profileError || !profileRow) {
    throw new Error(profileError?.message ?? "Profile not found");
  }

  // Compute stats with graceful fallbacks in case of RLS restrictions.
  let listingCount = 0;
  let soldCount = 0;
  let wonCount = 0;
  let avgRating = "No ratings yet";
  let totalReviews = 0;

  const nowIso = new Date().toISOString();

  try {
    const { data: listedItems } = await sb
      .from("item")
      .select("iid, auction!inner(end_time)")
      .eq("oid", profileRow.id)
      .eq("sold", false)
      .gt("auction.end_time", nowIso);

    listingCount = listedItems?.length ?? 0;
  } catch (err) {
    console.warn("[fetchPublicProfile] Unable to fetch listings:", err?.message);
  }

  try {
    const { count: sold } = await sb
      .from("items_sold")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", profileRow.id);
    soldCount = sold ?? 0;
  } catch (err) {
    console.warn("[fetchPublicProfile] Unable to fetch sold count:", err?.message);
  }

  try {
    const { count: won } = await sb
      .from("items_sold")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", profileRow.id);
    wonCount = won ?? 0;
  } catch (err) {
    console.warn("[fetchPublicProfile] Unable to fetch won count:", err?.message);
  }

  try {
    const { data: reviewStats } = await sb.rpc("review_stats", {
      p_reviewee: profileRow.id,
    });
    if (Array.isArray(reviewStats) && reviewStats[0]) {
      totalReviews = reviewStats[0].total ?? 0;
      const average = reviewStats[0].avg_rating ?? 0;
      avgRating = totalReviews > 0 ? Number(average).toFixed(1) : "No ratings yet";
    }
  } catch (err) {
    console.warn("[fetchPublicProfile] Unable to fetch review stats:", err?.message);
  }

  const stats = [
    { title: "Listing", number: listingCount },
    { title: "Sold", number: soldCount },
    { title: "Won", number: wonCount },
  ];

  return {
    ...profileRow,
    stats,
    avg_rating: avgRating,
    total_reviews: totalReviews,
    verified: Boolean(profileRow.verified),
  };
}

export default function PublicProfilePage() {
  const params = useParams();

  const sb = supabaseBrowser();

  const [profile, setProfile] = useState(null);
  const [viewerId, setViewerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const username = params?.username;

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!username) return;
      setLoading(true);
      setError(null);
      try {
        const [targetProfile, viewer] = await Promise.all([
          fetchPublicProfile(sb, username),
          sb.auth.getUser(),
        ]);

        await getAvatarPublicUrl(targetProfile);

        if (!active) return;

        setProfile(targetProfile);
        setViewerId(viewer?.data?.user?.id ?? null);
      } catch (err) {
        console.error("[PublicProfilePage] Failed to load profile", err);
        if (!active) return;
        setError("Unable to load this profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [username, sb]);

  useEffect(() => {
    if (!profile || !viewerId) return;
    if (profile.id === viewerId) {
      window.location.href = "/profile";
    }
  }, [profile, viewerId]);

  // Realtime subscription for review updates
  useEffect(() => {
    if (!profile?.id) return;

    console.log('[PublicProfile] Setting up review stats subscription for user:', profile.id);

    const channel = sb
      .channel(`review-stats-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review",
          filter: `reviewee_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log('[PublicProfile] Review changed, refetching stats:', payload);
          // Refetch review stats when a review changes
          try {
            const { data: reviewStats, error: rpcError } = await sb.rpc("review_stats", {
              p_reviewee: profile.id,
            });

            if (rpcError) {
              console.error('[PublicProfile] RPC error:', rpcError);
              return;
            }

            console.log('[PublicProfile] Review stats received:', reviewStats);

            if (Array.isArray(reviewStats) && reviewStats[0]) {
              const totalReviews = reviewStats[0].total ?? 0;
              const average = reviewStats[0].avg_rating ?? 0;
              const avgRating = totalReviews > 0 ? Number(average).toFixed(1) : "No ratings yet";

              console.log('[PublicProfile] Updating profile with avg_rating:', avgRating);

              setProfile((prev) => {
                const updated = {
                  ...prev,
                  avg_rating: avgRating,
                  total_reviews: totalReviews,
                };
                console.log('[PublicProfile] Profile updated:', { prev: prev.avg_rating, new: updated.avg_rating });
                return updated;
              });
            }
          } catch (err) {
            console.error("[PublicProfile] Failed to update review stats:", err);
          }
        }
      )
      .subscribe((status) => {
        console.log('[PublicProfile] Subscription status:', status);
      });

    return () => {
      console.log('[PublicProfile] Cleaning up review stats subscription');
      sb.removeChannel(channel);
    };
  }, [profile?.id, sb]);

  const handleShareProfile = () => {
    if (!profile?.username) return;
    const origin = window?.location?.origin ?? "";
    const shareUrl = `${origin}/user/${profile.username}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success("Profile link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  if (!loading && (error || !profile)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-slate-300">
        <p className="text-xl">{error ?? "Profile not found."}</p>
        <Button onClick={() => { window.location.href = "/profile"; }}>Back to my profile</Button>
      </div>
    );
  }

  const joinedAt = profile?.created_at;
  const joinedText = joinedAt ? getTimeAgo({ datetime: joinedAt }) : null;

  return (
    <div className="space-y-12">
      {loading && (
        <div className="flex h-[400px] items-center justify-center">
          <UISpinner className="size-6 text-blue-500" />
        </div>
      )}

      <h1
        className={`text-4xl font-bold text-[var(--theme-gold)] ${loading ? "hidden" : ""
          }`}
      >
        Seller profile: @{profile?.username}
      </h1>

      <Card variant="default" className={loading ? "hidden" : ""}>
        <CardContent>
          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start lg:w-auto">
              <Avatar avatar_url={profile?.avatar_url} username={profile?.username} />
              <div className="flex-1 text-center sm:text-left">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <h2 className="m-0 text-xl font-bold text-white">@{profile?.username}</h2>
                  <AvgReview number={profile?.avg_rating} />
                  {profile?.verified && <ShieldCheckIcon className="text-green-500" />}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm sm:justify-start">
                  {profile?.stats?.map((stat) => (
                    <Stats key={stat.title} {...stat} />
                  ))}
                  {joinedText && (
                    <span className="ml-1 text-xs text-slate-400">
                      Joined {joinedText}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Options icon="link" variant="info" onClick={handleShareProfile} text="Share" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={loading ? "hidden" : ""}>
        <Tabs defaultValue="auctions" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger
              value="auctions"
              className="data-[state=active]:bg-[var(--theme-primary)]/20 data-[state=active]:border-[var(--theme-primary)]"
            >
              Auctions
            </TabsTrigger>
            <TabsTrigger
              value="sold"
              className="data-[state=active]:bg-[var(--theme-primary)]/20 data-[state=active]:border-[var(--theme-primary)]"
            >
              Items Sold
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-[var(--theme-primary)]/20 data-[state=active]:border-[var(--theme-primary)]"
            >
              Reviews
            </TabsTrigger>
          </TabsList>
          <Card variant="default">
            <CardContent>
              <TabsContent value="auctions">
                <Auctions userId={profile?.id} />
              </TabsContent>
              <TabsContent value="sold">
                <ItemsSold userId={profile?.id} />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewWithComposer revieweeId={profile?.id} viewerId={viewerId} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
