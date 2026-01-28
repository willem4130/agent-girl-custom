
import { useEffect, useRef } from "react";
import { VideoGridSkeleton, VideoResultCard } from "./index";
import type { GeneratedVideo } from "./types";

interface VideoHistoryViewProps {
  videos: GeneratedVideo[];
  isLoading: boolean;
  pendingCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onRerun: (video: GeneratedVideo) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, prompt: string) => void;
  onCopy: (prompt: string) => void;
  onAttachImages: (imageUrl?: string) => void;
  onLoadMore: () => void;
}

export default function VideoHistoryView({
  videos,
  isLoading,
  pendingCount,
  hasMore,
  isLoadingMore,
  onRerun,
  onDelete,
  onDownload,
  onCopy,
  onAttachImages,
  onLoadMore,
}: VideoHistoryViewProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || isLoadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  return (
    <div className="animate-in fade-in duration-200">
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        <ul className="space-y-0">
          {/* Skeleton loaders while loading from database */}
          {isLoading && <VideoGridSkeleton count={3} />}

          {/* Skeleton loaders while generating new videos */}
          {!isLoading && pendingCount > 0 && (
            <VideoGridSkeleton count={pendingCount} />
          )}

          {/* Generated videos */}
          {!isLoading &&
            videos.map((video) => (
              <VideoResultCard
                key={video.id}
                video={video}
                onRerun={() => onRerun(video)}
                onDelete={() => onDelete(video.id)}
                onDownload={() => onDownload(video.url, video.prompt)}
                onCopy={() => onCopy(video.prompt)}
                onAttachImages={onAttachImages}
              />
            ))}

          {/* Load more trigger */}
          {!isLoading && videos.length > 0 && (
            <div ref={loadMoreRef} className="py-4">
              {isLoadingMore && <VideoGridSkeleton count={2} />}
            </div>
          )}

          {/* Empty state if no videos and not loading */}
          {!isLoading && videos.length === 0 && pendingCount === 0 && (
            <div className="flex h-full w-full items-center justify-center py-16">
              <div className="flex flex-col items-center justify-center gap-2">
                <h2 className="font-heading text-center text-2xl font-bold text-white uppercase">
                  Nothing Here Yet
                </h2>
                <p className="text-center text-sm text-zinc-300">
                  Add an image and hit generate
                </p>
              </div>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
