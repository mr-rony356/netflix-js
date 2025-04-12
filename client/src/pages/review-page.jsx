import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/header";
import ReviewForm from "@/components/content/review-form";
import { Button } from "@/components/ui/button";
import { getTMDbImageUrl } from "@/lib/utils";
import { FALLBACK_BACKDROP, ROUTES } from "@/lib/constants";

export default function ReviewPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { type, id } = params;

  // Validate params
  useEffect(() => {
    if (
      !type ||
      !id ||
      !(type === "movie" || type === "tv") ||
      isNaN(parseInt(id))
    ) {
      navigate("/");
    }
  }, [type, id, navigate]);

  // Get active profile
  const { data: activeProfile } = useQuery({
    queryKey: ["/api/profiles/active"],
  });

  // Fetch content details
  const { data: contentDetails, isLoading: isContentLoading } = useQuery({
    queryKey: [`/api/content/${type}/${id}`],
    enabled: !!type && !!id && !!activeProfile,
  });

  // Fetch existing review if any
  const { data: existingReviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: [`/api/reviews/content/${contentDetails?.contentId}`],
    enabled: !!contentDetails?.contentId && !!activeProfile,
  });

  // Find if user has already reviewed this content
  const userReview = existingReviews?.find(
    (review) => review.profileId === activeProfile?.id
  );

  const isLoading = isContentLoading || isReviewsLoading || !activeProfile;
console.log(contentDetails)
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16">
        {" "}
        {/* Add padding top to account for fixed header */}
        {/* Background image */}
        {contentDetails?.backdrop_path && (
          <div className="absolute top-0 left-0 w-full h-[30vh] z-0 opacity-30">
            <img
              src={getTMDbImageUrl(contentDetails.backdrop_path, "original")}
              alt={contentDetails.title || contentDetails.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
          </div>
        )}
        {/* Back button */}
        <div className="relative z-10 p-6 md:p-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.HOME)}
            className="mb-4 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : contentDetails ? (
            <ReviewForm
              contentId={contentDetails.contentId}
              profileId={activeProfile?.id}
              contentTitle={contentDetails.title || contentDetails.name}
              existingReview={userReview}
            />
          ) : (
            <div className="flex justify-center items-center min-h-[400px] text-red-500">
              <p>Content not found or unable to load details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
