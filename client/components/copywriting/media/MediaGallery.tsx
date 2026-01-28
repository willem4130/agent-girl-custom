/**
 * MediaGallery
 *
 * Grid display of generated images and videos.
 */

import { useState } from 'react';
import { useMediaGeneration, type GeneratedImage, type GeneratedVideo } from '../../../hooks/useMediaGeneration';

interface MediaGalleryProps {
  images: GeneratedImage[];
  videos: GeneratedVideo[];
  isLoading?: boolean;
  onImageDeleted?: (imageId: string) => void;
  onVideoDeleted?: (videoId: string) => void;
}

type FilterType = 'all' | 'images' | 'videos' | 'favorites';

export function MediaGallery({
  images,
  videos,
  isLoading,
  onImageDeleted,
  onVideoDeleted,
}: MediaGalleryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<{ type: 'image' | 'video'; id: string } | null>(null);

  const { deleteImage, deleteVideo, rateImage } = useMediaGeneration();

  // Filter items
  const filteredImages = filter === 'videos' ? [] :
    filter === 'favorites' ? images.filter(img => img.is_favorite) : images;
  const filteredVideos = filter === 'images' || filter === 'favorites' ? [] : videos;

  // Combine and sort by date
  const allItems = [
    ...filteredImages.map(img => ({ type: 'image' as const, item: img, date: img.created_at })),
    ...filteredVideos.map(vid => ({ type: 'video' as const, item: vid, date: vid.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = async (type: 'image' | 'video', id: string) => {
    if (type === 'image') {
      const success = await deleteImage(id);
      if (success) onImageDeleted?.(id);
    } else {
      const success = await deleteVideo(id);
      if (success) onVideoDeleted?.(id);
    }
    setSelectedItem(null);
  };

  const handleFavorite = async (imageId: string, isFavorite: boolean) => {
    await rateImage(imageId, 0, isFavorite);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'images', 'videos', 'favorites'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-border text-foreground hover:bg-background-tertiary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'all' && ` (${images.length + videos.length})`}
            {f === 'images' && ` (${images.length})`}
            {f === 'videos' && ` (${videos.length})`}
            {f === 'favorites' && ` (${images.filter(i => i.is_favorite).length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {allItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-2">
            {filter === 'favorites' ? '⭐' : '🎨'}
          </div>
          <p className="text-muted-foreground">
            {filter === 'favorites' ? 'No favorites yet' : 'No media generated yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {allItems.map(({ type, item }) => (
            <MediaCard
              key={item.id}
              type={type}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem({ type, id: item.id })}
              onFavorite={type === 'image' ? (fav) => handleFavorite(item.id, fav) : undefined}
            />
          ))}
        </div>
      )}

      {/* Selected Item Modal */}
      {selectedItem && (
        <MediaDetailModal
          type={selectedItem.type}
          item={selectedItem.type === 'image'
            ? images.find(i => i.id === selectedItem.id)!
            : videos.find(v => v.id === selectedItem.id)!
          }
          onClose={() => setSelectedItem(null)}
          onDelete={() => handleDelete(selectedItem.type, selectedItem.id)}
        />
      )}
    </div>
  );
}

// Media Card Component
interface MediaCardProps {
  type: 'image' | 'video';
  item: GeneratedImage | GeneratedVideo;
  isSelected?: boolean;
  onClick: () => void;
  onFavorite?: (isFavorite: boolean) => void;
}

function MediaCard({ type, item, isSelected, onClick, onFavorite }: MediaCardProps) {
  const isImage = type === 'image';
  const imageItem = item as GeneratedImage;
  const videoItem = item as GeneratedVideo;

  const _url = isImage ? imageItem.image_url : videoItem.video_url;
  const thumbnailUrl = isImage ? imageItem.image_url : videoItem.thumbnail_url;
  const status = item.status;

  return (
    <div
      className={`relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-border'
      }`}
      onClick={onClick}
    >
      {status === 'completed' && thumbnailUrl ? (
        <>
          {isImage ? (
            <img
              src={thumbnailUrl}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* Favorite Button (images only) */}
          {isImage && onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(!imageItem.is_favorite);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg
                className={`w-4 h-4 ${imageItem.is_favorite ? 'text-yellow-400 fill-current' : 'text-white'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          )}
        </>
      ) : status === 'pending' || status === 'processing' ? (
        <div className="w-full h-full bg-background-tertiary flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="w-full h-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}

      {/* Type Badge */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
        {isImage ? 'IMG' : `${videoItem.duration || 5}s`}
      </div>
    </div>
  );
}

// Detail Modal Component
interface MediaDetailModalProps {
  type: 'image' | 'video';
  item: GeneratedImage | GeneratedVideo;
  onClose: () => void;
  onDelete: () => void;
}

function MediaDetailModal({ type, item, onClose, onDelete }: MediaDetailModalProps) {
  const isImage = type === 'image';
  const imageItem = item as GeneratedImage;
  const videoItem = item as GeneratedVideo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Display */}
        <div className="relative">
          {isImage && imageItem.image_url ? (
            <img
              src={imageItem.image_url}
              alt="Generated"
              className="max-w-full max-h-[70vh] object-contain"
            />
          ) : videoItem.video_url ? (
            <video
              src={videoItem.video_url}
              controls
              autoPlay
              className="max-w-full max-h-[70vh]"
            />
          ) : (
            <div className="w-96 h-64 flex items-center justify-center bg-background-tertiary">
              <p className="text-muted-foreground">Media not available</p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Panel */}
        <div className="p-4 border-t border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{item.prompt}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{item.provider}</span>
                <span>{item.aspect_ratio}</span>
                {item.cost_cents && <span>${(item.cost_cents / 100).toFixed(2)}</span>}
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={onDelete}
                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
