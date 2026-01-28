
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useFileUpload } from "./useFileUpload";

interface UseImageUploadOptions {
  onStartImageChange?: (url: string | undefined) => void;
  onEndImageChange?: (url: string | undefined) => void;
  onSingleImageChange?: (url: string | undefined) => void;
  onModeChange?: (mode: "text-to-video" | "image-to-video") => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    onStartImageChange,
    onEndImageChange,
    onSingleImageChange,
    onModeChange,
  } = options;

  // Image state
  const [startImageUrl, setStartImageUrl] = useState<string | null>(null);
  const [endImageUrl, setEndImageUrl] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // File upload hook - uploads to /uploads/videos/ directory
  const { upload, isUploading } = useFileUpload({ category: "videos" });

  // Refs for file inputs
  const startImageInputRef = useRef<HTMLInputElement>(null);
  const endImageInputRef = useRef<HTMLInputElement>(null);
  const singleImageInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload for start/end frames or single image
  const handleImageUpload = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      type: "start" | "end" | "single"
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Upload file to local storage (stored in /uploads/videos/)
        const uploadedUrl = await upload(file);

        if (!uploadedUrl) {
          throw new Error("Upload failed");
        }

        if (type === "start") {
          setStartImageUrl(uploadedUrl);
          onStartImageChange?.(uploadedUrl);
          onModeChange?.("image-to-video");
        } else if (type === "end") {
          setEndImageUrl(uploadedUrl);
          onEndImageChange?.(uploadedUrl);
        } else {
          // Single image upload (for non-start/end frame models)
          onSingleImageChange?.(uploadedUrl);
          onModeChange?.("image-to-video");
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
        toast.error("Failed to upload image. Please try again.");
      }
    },
    [upload, onStartImageChange, onEndImageChange, onSingleImageChange, onModeChange]
  );

  // Clear image
  const clearImage = useCallback(
    (type: "start" | "end" | "single") => {
      if (type === "start") {
        setStartImageUrl(null);
        onStartImageChange?.(undefined);
        onModeChange?.("text-to-video");
        if (startImageInputRef.current) startImageInputRef.current.value = "";
      } else if (type === "end") {
        setEndImageUrl(null);
        onEndImageChange?.(undefined);
        if (endImageInputRef.current) endImageInputRef.current.value = "";
      } else {
        onSingleImageChange?.(undefined);
        onModeChange?.("text-to-video");
        if (singleImageInputRef.current) singleImageInputRef.current.value = "";
      }
    },
    [onStartImageChange, onEndImageChange, onSingleImageChange, onModeChange]
  );

  // Swap start and end images - captures current values synchronously to avoid stale closures
  const swapImages = useCallback(() => {
    // Capture current values immediately (before any async operations)
    const currentStart = startImageUrl;
    const currentEnd = endImageUrl;

    setIsSwapping(true);

    // Perform swap after fade-out animation
    setTimeout(() => {
      // Swap the values
      setStartImageUrl(currentEnd);
      setEndImageUrl(currentStart);

      // Notify parent of changes
      onStartImageChange?.(currentEnd || undefined);
      onEndImageChange?.(currentStart || undefined);

      // Update mode based on new start value
      if (currentEnd) {
        onModeChange?.("image-to-video");
      } else {
        onModeChange?.("text-to-video");
      }

      // Fade back in
      setTimeout(() => {
        setIsSwapping(false);
      }, 50);
    }, 150);
  }, [
    startImageUrl,
    endImageUrl,
    onStartImageChange,
    onEndImageChange,
    onModeChange,
  ]);

  // Reset all images (useful when switching models)
  const resetImages = useCallback(() => {
    setStartImageUrl(null);
    setEndImageUrl(null);
    if (startImageInputRef.current) startImageInputRef.current.value = "";
    if (endImageInputRef.current) endImageInputRef.current.value = "";
  }, []);

  // Attach image from a video result (cycles: first -> last -> reset)
  const attachImageFromResult = useCallback(
    (imageUrl: string, supportsStartEndFrames: boolean) => {
      if (supportsStartEndFrames) {
        // If no start image yet, or both are filled, set as start (reset)
        if (!startImageUrl || (startImageUrl && endImageUrl)) {
          // Reset: clear end image and set new start image
          setStartImageUrl(imageUrl);
          setEndImageUrl(null);
          onStartImageChange?.(imageUrl);
          onEndImageChange?.(undefined);
          onModeChange?.("image-to-video");
          toast.success("Start image attached");
        } else {
          // Start image exists but no end image, set as end
          setEndImageUrl(imageUrl);
          onEndImageChange?.(imageUrl);
          toast.success("End image attached");
        }
      } else {
        // Model doesn't support end frames, just replace start/single image
        setStartImageUrl(imageUrl);
        onSingleImageChange?.(imageUrl);
        onModeChange?.("image-to-video");
        toast.success("Image attached");
      }
    },
    [
      startImageUrl,
      endImageUrl,
      onStartImageChange,
      onEndImageChange,
      onSingleImageChange,
      onModeChange,
    ]
  );

  return {
    // State
    startImageUrl,
    endImageUrl,
    isSwapping,
    isUploading,

    // Refs
    startImageInputRef,
    endImageInputRef,
    singleImageInputRef,

    // Actions
    handleImageUpload,
    clearImage,
    swapImages,
    resetImages,
    attachImageFromResult,
  };
}
