
import useSWRInfinite from "swr/infinite";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/csrf";
import type { AssetTab } from "@/components/media/assets/AssetsSidebar";

const PAGE_SIZE = 18;

interface UploadedAsset {
  id: string;
  url: string;
  filename: string;
  category: string;
  type: "image" | "video" | "other";
  sizeBytes: number;
  createdAt: string;
}

interface GeneratedAsset {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  prompt: string;
  type: "image" | "video";
  aspectRatio?: string;
  createdAt: string;
}

type Asset = UploadedAsset | GeneratedAsset;

interface AssetsResponse {
  data: Asset[];
  count: number;
  nextCursor: string | null;
  hasMore: boolean;
}

const fetcher = async (url: string): Promise<AssetsResponse> => {
  const response = await apiFetch(url);
  if (!response.ok) throw new Error("Failed to fetch assets");
  return response.json();
};

export function useAssets(activeTab: AssetTab) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getKey = (pageIndex: number, previousPageData: AssetsResponse | null) => {
    // First page
    if (pageIndex === 0) return `/api/assets?tab=${activeTab}&limit=${PAGE_SIZE}`;
    // No more pages
    if (!previousPageData?.hasMore || !previousPageData?.nextCursor) return null;
    // Next page
    return `/api/assets?tab=${activeTab}&cursor=${previousPageData.nextCursor}&limit=${PAGE_SIZE}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<AssetsResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnMount: true,
      persistSize: true,
    });

  // Flatten all pages into a single array
  const assets = useMemo(() => data?.flatMap((page) => page.data) ?? [], [data]);
  const totalCount = data?.[0]?.count ?? 0;
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const isLoadingMore = isValidating && size > 1;

  // Load more assets
  const loadMore = useCallback(() => {
    if (!hasMore || isValidating) return;
    setSize((s) => s + 1);
  }, [hasMore, isValidating, setSize]);

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Delete selected assets
  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const selectedAssets = assets.filter((a) => selectedIds.has(a.id));
    let successCount = 0;

    // Optimistic update
    mutate(
      (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((page) => ({
          ...page,
          data: page.data.filter((a) => !selectedIds.has(a.id)),
          count: Math.max(0, page.count - selectedIds.size),
        }));
      },
      { revalidate: false }
    );

    for (const asset of selectedAssets) {
      const assetType =
        activeTab === "uploaded"
          ? "uploaded"
          : (asset as GeneratedAsset).type;
      const isUploaded = assetType === "uploaded";
      const url = isUploaded
        ? `/api/assets?type=uploaded&url=${encodeURIComponent((asset as UploadedAsset).url)}`
        : `/api/assets?type=${assetType}&id=${asset.id}`;

      try {
        const response = await apiFetch(url, { method: "DELETE" });
        if (response.ok) {
          successCount++;
        }
      } catch {
        // Continue with other deletions
      }
    }

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} asset${successCount > 1 ? "s" : ""}`);
      setSelectedIds(new Set());
    } else {
      // Revert on complete failure
      mutate();
    }

    return successCount;
  }, [selectedIds, assets, activeTab, mutate]);

  return {
    assets,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    selectedIds,
    selectedAssets: useMemo(
      () => assets.filter((a) => selectedIds.has(a.id)),
      [assets, selectedIds]
    ),
    loadMore,
    toggleSelect,
    clearSelection,
    deleteSelected,
    mutate,
  };
}

export type { UploadedAsset, GeneratedAsset, Asset };
