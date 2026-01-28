
import useSWRInfinite from "swr/infinite";
import { useCallback } from "react";
import { toast } from "sonner";
import type { GeneratedImage } from "@/components/media/image";
import { apiFetch } from "@/lib/csrf";

const PAGE_SIZE = 18;

interface ImagesResponse {
  data: GeneratedImage[];
  nextCursor: string | null;
  hasMore: boolean;
}

const fetcher = async (url: string): Promise<ImagesResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch images");
  return response.json();
};

export function useImages() {
  const getKey = (pageIndex: number, previousPageData: ImagesResponse | null) => {
    // First page
    if (pageIndex === 0) return `/api/images?limit=${PAGE_SIZE}`;
    // No more pages
    if (!previousPageData?.hasMore || !previousPageData?.nextCursor) return null;
    // Next page
    return `/api/images?cursor=${previousPageData.nextCursor}&limit=${PAGE_SIZE}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<ImagesResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnMount: true,
      persistSize: true,
    });

  // Flatten all pages into a single array
  const images = data?.flatMap((page) => page.data) ?? [];
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const isLoadingMore = isValidating && size > 1;

  // Load more images
  const loadMore = useCallback(() => {
    if (!hasMore || isValidating) return;
    setSize((s) => s + 1);
  }, [hasMore, isValidating, setSize]);

  // Add new image (optimistic update)
  const addImage = useCallback(
    (image: GeneratedImage) => {
      mutate(
        (currentData) => {
          if (!currentData || currentData.length === 0) {
            return [{ data: [image], nextCursor: null, hasMore: false }];
          }
          // Add to first page
          const newFirstPage = {
            ...currentData[0],
            data: [image, ...currentData[0].data],
          };
          return [newFirstPage, ...currentData.slice(1)];
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  // Delete image (optimistic update)
  const deleteImage = useCallback(
    async (id: string) => {
      // Optimistic update
      mutate(
        (currentData) => {
          if (!currentData) return currentData;
          return currentData.map((page) => ({
            ...page,
            data: page.data.filter((img) => img.id !== id),
          }));
        },
        { revalidate: false }
      );

      // Delete from server
      try {
        const response = await apiFetch(`/api/images/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error("Failed to delete image");
          mutate(); // Revert on error
        } else {
          toast.success("Image deleted");
        }
      } catch {
        toast.error("Failed to delete image");
        mutate(); // Revert on error
      }
    },
    [mutate]
  );

  // Download image
  const downloadImage = useCallback(async (url: string, prompt: string) => {
    let blobUrl: string | null = null;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        toast.error("Failed to download image");
        return;
      }
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Failed to download image");
    } finally {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    }
  }, []);

  return {
    images,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    addImage,
    deleteImage,
    downloadImage,
    mutate,
  };
}
