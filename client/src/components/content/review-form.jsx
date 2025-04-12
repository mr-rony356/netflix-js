import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import StarRating from "./star-rating";
import { ROUTES } from "@/lib/constants";

// Review form schema
const reviewSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  review: z
    .string()
    .max(500, { message: "Review must be 500 characters or less" })
    .optional(),
  isPublic: z.boolean().default(true),
});

export default function ReviewForm({
  contentId,
  profileId,
  contentTitle,
  existingReview,
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      review: existingReview?.review || "",
      isPublic: existingReview?.isPublic ?? true,
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (values) => {
      const response = await apiRequest("POST", "/api/reviews", {
        contentId,
        profileId,
        ...values,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/reviews/content/${contentId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/reviews/profile/${profileId}`],
      });

      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });

      navigate(ROUTES.HOME);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async (values) => {
      if (!existingReview?.id)
        throw new Error("No review ID provided for update");

      const response = await apiRequest(
        "PATCH",
        `/api/reviews/${existingReview.id}`,
        values
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/reviews/content/${contentId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/reviews/profile/${profileId}`],
      });

      toast({
        title: "Review updated",
        description: "Your review has been updated successfully",
      });

      navigate(ROUTES.HOME);
    },
    onError: (error) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values) => {
    // If either rating or review is provided (not both required)
    if (
      values.rating !== undefined ||
      (values.review && values.review.trim() !== "")
    ) {
      if (existingReview?.id) {
        updateReviewMutation.mutate(values);
      } else {
        createReviewMutation.mutate(values);
      }
    } else {
      toast({
        title: "Rating or review required",
        description: "Please provide either a star rating or written review",
        variant: "destructive",
      });
    }
  };

  const isPending =
    createReviewMutation.isPending || updateReviewMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">
        {existingReview ? "Edit your review" : "Write a review"}
      </h2>
      <h3 className="text-xl mb-8 text-gray-300">{contentTitle}</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-lg mb-2">
                  Your Rating
                </FormLabel>
                <FormControl>
                  <StarRating
                    rating={field.value || 0}
                    onRating={(rate) => field.onChange(rate)}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="review"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white text-lg mb-2">
                  Your Review
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What did you think about it? (optional)"
                    className="h-32 bg-gray-800 border-gray-700 text-white resize-none"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-gray-400 mt-1">
                  {field.value
                    ? `${field.value.length}/500 characters`
                    : "0/500 characters"}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-white">Public Review</FormLabel>
                  <p className="text-sm text-gray-400">
                    Make your review visible to other users. If private, only
                    you and admins can view it.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ROUTES.HOME)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {isPending
                ? "Submitting..."
                : existingReview
                ? "Update Review"
                : "Submit Review"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
