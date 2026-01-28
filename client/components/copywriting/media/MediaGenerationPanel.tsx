/**
 * MediaGenerationPanel
 *
 * Main panel for image and video generation.
 */

import { useState, useEffect } from 'react';
import { ImageGenerationTab } from './ImageGenerationTab';
import { VideoGenerationTab } from './VideoGenerationTab';
import { MediaGallery } from './MediaGallery';
import { useMediaGeneration, type GeneratedImage, type GeneratedVideo } from '../../../hooks/useMediaGeneration';

interface MediaGenerationPanelProps {
  brandId: string;
  copyId?: string;
  copyText?: string;
  onClose?: () => void;
}

type TabType = 'images' | 'videos' | 'gallery';

export function MediaGenerationPanel({ brandId, copyId, copyText, onClose }: MediaGenerationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchImagesByBrand, fetchVideosByBrand } = useMediaGeneration();

  // Load existing media for the brand
  useEffect(() => {
    async function loadMedia() {
      setIsLoading(true);
      const [brandImages, brandVideos] = await Promise.all([
        fetchImagesByBrand(brandId),
        fetchVideosByBrand(brandId),
      ]);
      setImages(brandImages);
      setVideos(brandVideos);
      setIsLoading(false);
    }
    loadMedia();
  }, [brandId, fetchImagesByBrand, fetchVideosByBrand]);

  const handleImageGenerated = (image: GeneratedImage) => {
    setImages(prev => [image, ...prev]);
  };

  const handleVideoGenerated = (video: GeneratedVideo) => {
    setVideos(prev => [video, ...prev]);
  };

  const handleImageDeleted = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleVideoDeleted = (videoId: string) => {
    setVideos(prev => prev.filter(vid => vid.id !== videoId));
  };

  return (
    <div className="flex flex-col h-full bg-background-secondary rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Media Generation</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-background-tertiary text-muted-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <TabButton
          label="Generate Image"
          icon={<ImageIcon />}
          isActive={activeTab === 'images'}
          onClick={() => setActiveTab('images')}
        />
        <TabButton
          label="Generate Video"
          icon={<VideoIcon />}
          isActive={activeTab === 'videos'}
          onClick={() => setActiveTab('videos')}
        />
        <TabButton
          label={`Gallery (${images.length + videos.length})`}
          icon={<GalleryIcon />}
          isActive={activeTab === 'gallery'}
          onClick={() => setActiveTab('gallery')}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'images' && (
          <ImageGenerationTab
            brandId={brandId}
            copyId={copyId}
            copyText={copyText}
            onImageGenerated={handleImageGenerated}
          />
        )}
        {activeTab === 'videos' && (
          <VideoGenerationTab
            brandId={brandId}
            copyId={copyId}
            copyText={copyText}
            images={images}
            onVideoGenerated={handleVideoGenerated}
          />
        )}
        {activeTab === 'gallery' && (
          <MediaGallery
            images={images}
            videos={videos}
            isLoading={isLoading}
            onImageDeleted={handleImageDeleted}
            onVideoDeleted={handleVideoDeleted}
          />
        )}
      </div>
    </div>
  );
}

// Tab Button Component
interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, icon, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'text-primary border-b-2 border-primary -mb-px'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// Icons
function ImageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
