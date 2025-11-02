"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { supabaseBrowser } from "@/utils/supabase/client";
import Spinner from "@/components/SpinnerComponent";
import ReviewCard from "@/components/Profile/Review/ReviewCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/context/ModalContext";

const MIN_REVIEW_LENGTH = 10;

function ReviewFormFields({ initialStars, initialReview }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="review-stars" className="text-[var(--theme-muted)]">
          Rating
        </Label>
        <select
          id="review-stars"
          name="review-stars"
          defaultValue={initialStars}
          className="mt-1 w-24 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-[var(--theme-surface-contrast)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value} star{value > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="review-text" className="text-[var(--theme-muted)]">
          Share your experience
        </Label>
        <Textarea
          id="review-text"
          name="review-text"
          defaultValue={initialReview}
          placeholder="Tell other buyers about this seller…"
          className="mt-1 min-h-[140px] resize-y border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-surface-contrast)] focus-visible:ring-[var(--theme-primary)]"
        />
      </div>
    </div>
  );
}

export default function ReviewWithComposer({ revieweeId, viewerId }) {
  const sb = supabaseBrowser();
  const { setModalHeader, setModalFooter, setModalForm, setModalState } = useModal();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [viewerReview, setViewerReview] = useState(null);
  const [starFilter, setStarFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  const hasViewerReview = Boolean(viewerReview);

  const viewerAllowed = useMemo(() => {
    if (!viewerId) return false;
    if (!revieweeId) return false;
    if (viewerId === revieweeId) return false;
    return canReview;
  }, [viewerId, revieweeId, canReview]);

  const fetchReviews = useCallback(async () => {
    if (!revieweeId) {
      setReviews([]);
      setCanReview(false);
      setViewerReview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: reviewList, error: reviewError } = await sb
        .from("review")
        .select(
          `
            reviewee_id,
            reviewer_id,
            review,
            stars,
            time_created,
            reviewer:reviewer_id(
              username,
              first_name,
              last_name,
              avatar_bucket,
              object_path
            )
          `
        )
        .eq("reviewee_id", revieweeId)
        .order("time_created", { ascending: false });

      if (reviewError) throw reviewError;

      let eligible = false;
      let existing = null;

      if (viewerId && viewerId !== revieweeId) {
        const { data: purchases, error: purchaseError } = await sb
          .from("items_sold")
          .select("sid")
          .eq("seller_id", revieweeId)
          .eq("buyer_id", viewerId)
          .limit(1);

        if (purchaseError) throw purchaseError;

        eligible = Array.isArray(purchases) && purchases.length > 0;

        if (eligible) {
          const { data: existingReview, error: existingError } = await sb
            .from("review")
            .select("review, stars, time_created")
            .eq("reviewee_id", revieweeId)
            .eq("reviewer_id", viewerId)
            .order("time_created", { ascending: false })
            .limit(1);

          if (existingError) throw existingError;

          if (existingReview?.length) {
            existing = existingReview[0];
          }
        }
      }

      setReviews(reviewList ?? []);
      setCanReview(eligible);
      setViewerReview(existing);
    } catch (err) {
      console.error("[ReviewWithComposer] Failed to fetch reviews", err);
      setReviews([]);
      setCanReview(false);
      setViewerReview(null);
    } finally {
      setLoading(false);
    }
  }, [sb, revieweeId, viewerId]);

  useEffect(() => {
    let active = true;

    fetchReviews();

    if (!revieweeId) return undefined;

    const channel = sb
      .channel(`profile-reviews-${revieweeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review",
          filter: `reviewee_id=eq.${revieweeId}`,
        },
        () => {
          if (active) fetchReviews();
        }
      )
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, [sb, revieweeId, fetchReviews]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!viewerAllowed) return;

      const formData = new FormData(event.currentTarget);
      const stars = Number(formData.get("review-stars"));
      const reviewBody = (formData.get("review-text") || "").toString().trim();

      if (!reviewBody || reviewBody.length < MIN_REVIEW_LENGTH) {
        toast.error(`Review must be at least ${MIN_REVIEW_LENGTH} characters.`);
        return;
      }
      if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
        toast.error("Rating must be between 1 and 5 stars.");
        return;
      }

      try {
        if (viewerReview) {
          const { error: deleteError } = await sb
            .from("review")
            .delete()
            .eq("reviewee_id", revieweeId)
            .eq("reviewer_id", viewerId);
          if (deleteError) throw deleteError;
        }

        const { error: insertError } = await sb.from("review").insert([
          {
            reviewee_id: revieweeId,
            reviewer_id: viewerId,
            review: reviewBody,
            stars,
          },
        ]);
        if (insertError) throw insertError;

        toast.success("Review saved.");
        setViewerReview({
          review: reviewBody,
          stars,
          time_created: new Date().toISOString(),
        });
        setModalState({ open: false });
        await fetchReviews();
      } catch (err) {
        console.error("[ReviewWithComposer] Failed to submit review", err);
        toast.error(err.message ?? "Unable to submit review.");
      }
    },
    [viewerAllowed, viewerReview, sb, revieweeId, viewerId, setModalState, fetchReviews]
  );

  const filteredReviews = useMemo(() => {
    const working = [...reviews];

    const ratingFilter = starFilter === "all" ? null : Number(starFilter);
    const filtered = ratingFilter
      ? working.filter((review) => Number(review.stars) === ratingFilter)
      : working;

    filtered.sort((a, b) => {
      const aTime = new Date(a.time_created).getTime();
      const bTime = new Date(b.time_created).getTime();
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });

    return filtered;
  }, [reviews, starFilter, sortOrder]);

  const openReviewModal = () => {
    if (!viewerAllowed) return;

    const initialStars = hasViewerReview ? String(viewerReview.stars ?? 5) : "5";
    const initialReview = viewerReview?.review ?? "";

    const modalTitle = hasViewerReview ? "Update your review" : "Leave a review";
    const modalDescription = hasViewerReview
      ? "You can revise your previous review below."
      : "Share your experience with this seller.";

    setModalHeader({
      title: modalTitle,
      description: modalDescription,
    });
    setModalFooter({
      showCancel: true,
      cancelText: "Cancel",
      cancelVariant: "outline",
      showSubmit: true,
      submitText: viewerReview ? "Save changes" : "Submit review",
      submitVariant: "brand",
    });
    setModalForm({
      isForm: true,
      onSubmit: handleSubmit,
    });
    setModalState({
      open: true,
      content: (
        <ReviewFormFields
          initialStars={initialStars}
          initialReview={initialReview}
        />
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {viewerAllowed ? (
          <Button
            variant="brand"
            onClick={openReviewModal}
            className="self-end md:self-auto"
          >
            {hasViewerReview ? "Update review" : "Leave a review"}
          </Button>
        ) : (
          <div className="flex-1 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 text-sm text-[var(--theme-muted)]">
            {viewerId === revieweeId
              ? "You cannot review your own seller profile."
              : viewerId
              ? "Only verified buyers who have completed a purchase with this seller can leave a review."
              : "Sign in and complete a purchase with this seller to leave a review."}
          </div>
        )}

        <div className="flex w-full flex-col gap-3 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-sm text-[var(--theme-muted)] md:w-auto md:flex-row md:items-center md:gap-4">
          <label className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
            <span>Filter by rating</span>
            <select
              value={starFilter}
              onChange={(event) => setStarFilter(event.target.value)}
              className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-[var(--theme-surface-contrast)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            >
              <option value="all">All</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} star{value > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
            <span>Sort by date</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-[var(--theme-surface-contrast)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="md" className="text-[var(--theme-primary)]" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] py-20 text-center text-[var(--theme-muted)]">
          No reviews match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <div
              key={`${review.reviewee_id}-${review.reviewer_id}-${index}`}

            >
              <ReviewCard review={review} sb={sb} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
