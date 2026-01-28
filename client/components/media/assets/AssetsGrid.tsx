
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { toast } from "sonner";
import JSZip from "jszip";
import type { AssetTab } from "./AssetsSidebar";
import {
  useAssets,
  type UploadedAsset,
  type GeneratedAsset,
} from "@/hooks/useAssets";

const CheckIcon = ({ dark = false }: { dark?: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke={dark ? "#000" : "currentColor"}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Skeleton component for loading state
function AssetSkeleton() {
  return (
    <div className="aspect-square rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="skeleton-loader size-full" />
    </div>
  );
}

interface AssetsGridProps {
  activeTab: AssetTab;
  searchQuery: string;
  onCountChange?: (tab: AssetTab, count: number) => void;
}

export default function AssetsGrid({
  activeTab,
  searchQuery,
  onCountChange,
}: AssetsGridProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use SWR-powered hook for cached data
  const {
    assets,
    totalCount,
    isLoading,
    isLoadingMore,
    hasMore,
    selectedIds,
    selectedAssets: selectedAssetsList,
    loadMore,
    toggleSelect,
    clearSelection,
    deleteSelected,
  } = useAssets(activeTab);

  // Notify parent of count changes
  useEffect(() => {
    onCountChange?.(activeTab, totalCount);
  }, [activeTab, totalCount, onCountChange]);

  // Clear selection on tab change
  useEffect(() => {
    clearSelection();
  }, [activeTab, clearSelection]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || isLoadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  // Filter assets by search query
  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assets;

    const query = searchQuery.toLowerCase();
    return assets.filter((asset) => {
      if ("filename" in asset) {
        return (
          (asset as UploadedAsset).filename.toLowerCase().includes(query) ||
          (asset as UploadedAsset).category.toLowerCase().includes(query)
        );
      }
      return (asset as GeneratedAsset).prompt.toLowerCase().includes(query);
    });
  }, [assets, searchQuery]);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedIds.size === 0 || isDownloading) return;

    setIsDownloading(true);
    const loadingToast = toast.loading(
      selectedIds.size === 1 ? "Preparing download..." : "Creating zip file..."
    );

    try {
      if (selectedAssetsList.length === 1) {
        const asset = selectedAssetsList[0];
        const response = await fetch(asset.url);
        const blob = await response.blob();

        const ext = asset.type === "video" ? ".mp4" : ".jpg";
        const filename =
          "filename" in asset
            ? (asset as UploadedAsset).filename
            : `asset-${asset.id}${ext}`;

        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        toast.success("Download started", { id: loadingToast });
      } else {
        const zip = new JSZip();

        for (let i = 0; i < selectedAssetsList.length; i++) {
          const asset = selectedAssetsList[i];
          try {
            const response = await fetch(asset.url);
            const blob = await response.blob();

            const ext = asset.type === "video" ? ".mp4" : ".jpg";
            const filename =
              "filename" in asset
                ? (asset as UploadedAsset).filename
                : `asset-${i + 1}${ext}`;

            zip.file(filename, blob);
          } catch (error) {
            console.error(`Failed to fetch ${asset.url}:`, error);
          }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `assets-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        toast.success(`Downloaded ${selectedAssetsList.length} files`, {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed", { id: loadingToast });
    } finally {
      setIsDownloading(false);
    }
  }, [selectedIds, isDownloading, selectedAssetsList]);

  const title = activeTab === "generated" ? "Generated Assets" : "Uploaded Assets";
  const isEmpty = !isLoading && filteredAssets.length === 0;

  // Get selected assets for thumbnail preview (limit to 2)
  const selectedAssetsThumbnails = useMemo(() => {
    return selectedAssetsList.slice(0, 2);
  }, [selectedAssetsList]);

  return (
    <section className="relative grid grid-rows-[auto_1fr] gap-4 min-h-0 flex-1">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-lg text-white uppercase">
          {title}
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-400">
              ({filteredAssets.length}{searchQuery ? ` of ${totalCount}` : ""})
            </span>
          )}
        </h1>
      </header>

      {/* Grid Container */}
      <div className="relative w-full h-full border border-white/10 border-b-0 bg-black/40 backdrop-blur-xl min-h-0 p-4 pb-20 overflow-y-auto rounded-t-[1.25rem] select-none">
        {isLoading ? (
          // Initial loading skeleton grid
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <AssetSkeleton key={i} />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <h2 className="font-heading text-center text-2xl font-bold text-white uppercase">
                Nothing Here Yet
              </h2>
              <p className="text-center text-sm text-zinc-300">
                {activeTab === "generated"
                  ? "Generate images or videos to see them here"
                  : "Upload files to see them here"}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredAssets.map((asset) =>
                activeTab === "uploaded" ? (
                  <UploadedAssetCard
                    key={asset.id}
                    asset={asset as UploadedAsset}
                    isSelected={selectedIds.has(asset.id)}
                    onToggleSelect={() => toggleSelect(asset.id)}
                  />
                ) : (
                  <GeneratedAssetCard
                    key={asset.id}
                    asset={asset as GeneratedAsset}
                    isSelected={selectedIds.has(asset.id)}
                    onToggleSelect={() => toggleSelect(asset.id)}
                  />
                )
              )}
            </div>

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-3">
                  <div className="size-5 animate-spin rounded-full border-2 border-pink-400/30 border-t-pink-400" />
                  <span className="text-sm text-zinc-400">Loading more...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center h-12 px-1 gap-1 rounded-full backdrop-blur-[2rem] z-50"
          style={{
            boxShadow:
              "rgba(255, 255, 255, 0.3) -0.5px -0.5px 1px 0px inset, rgba(255, 255, 255, 0.6) 0.8px 0.5px 0.5px 0px inset",
            background:
              "linear-gradient(0deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.06) 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.8) 100%), rgba(204, 204, 204, 0.2)",
            backgroundBlendMode: "normal, normal, color-burn",
          }}
        >
          {/* Selected count with image stack */}
          <div className="grid grid-cols-[auto_1fr] items-center h-full gap-2 px-3">
            <div className="relative size-4">
              {selectedAssetsThumbnails.map((asset, index) => {
                const isVideo = asset.type === "video";
                const thumbnailUrl =
                  "thumbnailUrl" in asset ? asset.thumbnailUrl : null;
                return (
                  <figure
                    key={asset.id}
                    className="absolute top-0 left-0 size-full overflow-hidden rounded-xs ring-1 ring-white shadow-md"
                    style={{
                      zIndex: index + 1,
                      transform: index === 0 ? "rotate(-2deg)" : "rotate(12deg)",
                    }}
                  >
                    {isVideo ? (
                      thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt="selected asset"
                                                    className="object-cover"
                         
                        />
                      ) : (
                        <video
                          src={asset.url}
                          className="absolute inset-0 size-full object-cover"
                          muted
                          playsInline
                        />
                      )
                    ) : (
                      <img
                        src={asset.url}
                        alt="selected asset"
                                                className="object-cover"
                       
                      />
                    )}
                  </figure>
                );
              })}
            </div>
            <p className="text-sm font-semibold flex whitespace-nowrap">
              <span className="min-w-3 pr-1 text-left">{selectedIds.size}</span>
              selected
            </p>
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownloadSelected}
            disabled={isDownloading}
            className="flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-bold transition-colors disabled:opacity-50"
            style={{
              color: "#f472b6",
              backgroundColor: "rgba(244, 114, 182, 0.15)",
              boxShadow:
                "rgba(244, 114, 182, 0.3) -0.5px -0.5px 1px 0px inset, rgba(244, 114, 182, 0.4) 0.8px 0.5px 0.5px 0px inset",
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.backgroundColor = "rgba(244, 114, 182, 0.25)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(244, 114, 182, 0.15)";
            }}
          >
            {isDownloading ? (
              <div className="size-5 animate-spin rounded-full border-2 border-pink-400/30 border-t-pink-400" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.25 14.75V19.25C20.25 19.8023 19.8023 20.25 19.25 20.25H4.75C4.19772 20.25 3.75 19.8023 3.75 19.25V14.75M12 15V3.75M12 15L8.5 11.5M12 15L15.5 11.5" />
              </svg>
            )}
            {isDownloading ? "Downloading..." : "Download"}
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={deleteSelected}
            className="flex items-center justify-center size-10 rounded-full transition hover:bg-white/10"
            style={{
              backdropFilter: "blur(2rem)",
              boxShadow:
                "rgba(255, 255, 255, 0.3) -0.5px -0.5px 1px 0px inset, rgba(255, 255, 255, 0.6) 0.8px 0.5px 0.5px 0px inset",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.75 6.5L5.72041 20.32C5.7572 20.8439 6.19286 21.25 6.71796 21.25H17.282C17.8071 21.25 18.2428 20.8439 18.2796 20.32L19.25 6.5" />
              <path d="M3.25 5.75H20.75" />
              <path d="M8.5246 5.58289C8.73079 3.84652 10.2081 2.5 12 2.5C13.7919 2.5 15.2692 3.84652 15.4754 5.58289" />
              <path d="M10 10.5V16.25" />
              <path d="M14 10.5V16.25" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}

function UploadedAssetCard({
  asset,
  isSelected,
  onToggleSelect,
}: {
  asset: UploadedAsset;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const isVideo = asset.type === "video";
  const [isLoaded, setIsLoaded] = useState(!isVideo); // Videos without thumbnails load immediately
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      setIsPlaying(false);
      setIsVideoLoading(false);
    } else if (isVideoLoading) {
      setIsVideoLoading(false);
    } else {
      setIsVideoLoading(true);
    }
  };

  const handleVideoReady = () => {
    setIsVideoLoading(false);
    setIsPlaying(true);
  };

  return (
    <figure
      aria-selected={isSelected}
      className="grid-item-perf group relative aspect-square overflow-hidden rounded-2xl border border-white/10 cursor-pointer ring-3 ring-transparent aria-selected:ring-white hover:ring-white/30 transition"
      onClick={onToggleSelect}
    >
      {/* Skeleton loader - fades out when loaded */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="skeleton-loader size-full" />
      </div>

      {isVideo ? (
        <>
          {/* Video - rendered when loading or playing */}
          {(isVideoLoading || isPlaying) && (
            <video
              src={asset.url}
              className={`absolute inset-0 size-full object-cover z-10 pointer-events-none transition-opacity duration-200 ${
                isPlaying ? "opacity-100" : "opacity-0"
              }`}
              muted
              playsInline
              autoPlay
              loop
              onCanPlay={handleVideoReady}
            />
          )}
          {/* Video placeholder - visible until playing */}
          {!isPlaying && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900" />
          )}
          {/* Play/Pause/Loading button overlay */}
          <button
            type="button"
            onClick={handlePlayPause}
            className={`absolute inset-0 z-15 flex items-center justify-center transition-opacity ${
              isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-110">
              {isVideoLoading ? (
                <div className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  {isPlaying ? (
                    <>
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </>
                  ) : (
                    <path d="M8 5.14v14l11-7-11-7z" />
                  )}
                </svg>
              )}
            </div>
          </button>
        </>
      ) : (
        <img
          src={asset.url}
          alt={asset.filename}
                    loading="lazy"
         
          className={`object-cover z-10 transition group-hover:brightness-75 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
         
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      )}

      {/* Selection checkbox */}
      <label
        className={`absolute top-0 left-0 z-20 p-2 transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={`size-5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-white border-white"
              : "border-white/70 bg-black/30"
          }`}
        >
          <span className={isSelected ? "opacity-100" : "opacity-0"}>
            <CheckIcon dark />
          </span>
        </button>
      </label>

      {/* Category badge */}
      <div className="absolute top-2 right-2 z-20 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white capitalize">
        {asset.category}
      </div>
    </figure>
  );
}

function GeneratedAssetCard({
  asset,
  isSelected,
  onToggleSelect,
}: {
  asset: GeneratedAsset;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const isVideo = asset.type === "video";
  const thumbnailUrl = asset.thumbnailUrl || null;
  // If video without thumbnail, consider it "loaded" immediately
  const [isLoaded, setIsLoaded] = useState(isVideo && !thumbnailUrl);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      setIsPlaying(false);
      setIsVideoLoading(false);
    } else if (isVideoLoading) {
      setIsVideoLoading(false);
    } else {
      setIsVideoLoading(true);
    }
  };

  const handleVideoReady = () => {
    setIsVideoLoading(false);
    setIsPlaying(true);
  };

  return (
    <figure
      aria-selected={isSelected}
      className="grid-item-perf group relative aspect-square overflow-hidden rounded-2xl border border-white/10 cursor-pointer ring-3 ring-transparent aria-selected:ring-white hover:ring-white/30 transition"
      onClick={onToggleSelect}
    >
      {/* Skeleton loader - fades out when loaded */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="skeleton-loader size-full" />
      </div>

      {isVideo ? (
        <>
          {/* Video - rendered when loading or playing */}
          {(isVideoLoading || isPlaying) && (
            <video
              src={asset.url}
              className={`absolute inset-0 size-full object-cover z-10 pointer-events-none transition-opacity duration-200 ${
                isPlaying ? "opacity-100" : "opacity-0"
              }`}
              muted
              playsInline
              autoPlay
              loop
              onCanPlay={handleVideoReady}
            />
          )}
          {/* Thumbnail image - visible until playing */}
          {!isPlaying && thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={asset.prompt}
                            loading="lazy"
             
              className={`object-cover z-10 transition group-hover:brightness-75 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
             
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
            />
          )}
          {/* Placeholder when no thumbnail and not playing */}
          {!isPlaying && !thumbnailUrl && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900" />
          )}
          {/* Play/Pause/Loading button overlay */}
          <button
            type="button"
            onClick={handlePlayPause}
            className={`absolute inset-0 z-15 flex items-center justify-center transition-opacity ${
              isPlaying ? "opacity-0 hover:opacity-100" : isVideoLoading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 hover:scale-110">
              {isVideoLoading ? (
                <div className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  {isPlaying ? (
                    <>
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </>
                  ) : (
                    <path d="M8 5.14v14l11-7-11-7z" />
                  )}
                </svg>
              )}
            </div>
          </button>
        </>
      ) : (
        <img
          src={asset.url}
          alt={asset.prompt}
                    loading="lazy"
         
          className={`object-cover z-10 transition group-hover:brightness-75 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
         
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      )}

      {/* Selection checkbox */}
      <label
        className={`absolute top-0 left-0 z-20 p-2 transition-opacity ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={`size-5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-white border-white"
              : "border-white/70 bg-black/30"
          }`}
        >
          <span className={isSelected ? "opacity-100" : "opacity-0"}>
            <CheckIcon dark />
          </span>
        </button>
      </label>

      {/* Type badge */}
      <div className="absolute top-2 right-2 z-20 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white capitalize">
        {asset.type}
      </div>
    </figure>
  );
}
