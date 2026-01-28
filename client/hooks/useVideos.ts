
import useSWRInfinite from "swr/infinite";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { GeneratedVideo } from "@/components/media/video";
import { apiFetch } from "@/lib/csrf";

const PAGE_SIZE = 8;

interface VideosResponse {
  data: GeneratedVideo[];
  nextCursor: string | null;
  hasMore: boolean;
}

const fetcher = async (url: string): Promise<VideosResponse> => {
  const response = await apiFetch(url, {});
  if (!response.ok) throw new Error("Failed to fetch videos");
  return response.json();
};

export function useVideos() {
  const [showResults, setShowResults] = useState(false);

  const getKey = (pageIndex: number, previousPageData: VideosResponse | null) => {
    // First page
    if (pageIndex === 0) return `/api/videos?limit=${PAGE_SIZE}`;
    // No more pages
    if (!previousPageData?.hasMore || !previousPageData?.nextCursor) return null;
    // Next page
    return `/api/videos?cursor=${previousPageData.nextCursor}&limit=${PAGE_SIZE}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<VideosResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnMount: true,
      persistSize: true,
      onSuccess: (data) => {
        // Auto-show results if there are videos
        if (data && data[0]?.data?.length > 0) {
          setShowResults(true);
        }
      },
    });

  // Flatten all pages into a single array
  const videos = data?.flatMap((page) => page.data) ?? [];
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const isLoadingMore = isValidating && size > 1;

  // Load more videos
  const loadMore = useCallback(() => {
    if (!hasMore || isValidating) return;
    setSize((s) => s + 1);
  }, [hasMore, isValidating, setSize]);

  // Add new video (optimistic update)
  const addVideo = useCallback(
    (video: GeneratedVideo) => {
      mutate(
        (currentData) => {
          if (!currentData || currentData.length === 0) {
            return [{ data: [video], nextCursor: null, hasMore: false }];
          }
          // Add to first page
          const newFirstPage = {
            ...currentData[0],
            data: [video, ...currentData[0].data],
          };
          return [newFirstPage, ...currentData.slice(1)];
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  // Delete video (optimistic update)
  const deleteVideo = useCallback(
    async (id: string) => {
      // Optimistic update
      mutate(
        (currentData) => {
          if (!currentData) return currentData;
          return currentData.map((page) => ({
            ...page,
            data: page.data.filter((v) => v.id !== id),
          }));
        },
        { revalidate: false }
      );

      // Delete from server
      try {
        const response = await apiFetch(`/api/videos/${id}`, {
          method: "DELETE",
          
        });
        if (!response.ok) {
          toast.error("Failed to delete video");
          mutate(); // Revert on error
        }
      } catch {
        toast.error("Failed to delete video");
        mutate(); // Revert on error
      }
    },
    [mutate]
  );

  // Download video
  const downloadVideo = useCallback(async (url: string, prompt: string) => {
    let blobUrl: string | null = null;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        toast.error("Failed to download video");
        return;
      }
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Failed to download video");
    } finally {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    }
  }, []);

  // Copy prompt to clipboard
  const copyPrompt = useCallback((prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard");
  }, []);

  return {
    videos,
    isLoading,
    isLoadingMore,
    hasMore,
    hasVideos: videos.length > 0,
    showResults,
    setShowResults,
    error,
    loadMore,
    addVideo,
    deleteVideo,
    downloadVideo,
    copyPrompt,
    mutate,
  };
}
