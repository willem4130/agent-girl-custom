
import { useState, useRef, useCallback } from "react";

interface UseVideoPlaybackReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoading: boolean;
  isPlaying: boolean;
  handlePlayPause: () => void;
  handleVideoReady: () => void;
  handleVideoEnd: () => void;
}

export function useVideoPlayback(): UseVideoPlaybackReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      // Pause existing video
      videoRef.current?.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else if (isLoading) {
      // Cancel loading
      setIsLoading(false);
    } else {
      // Start loading - video will render and call handleVideoReady when ready
      setIsLoading(true);
    }
  }, [isPlaying, isLoading]);

  const handleVideoReady = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(true);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return {
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    isLoading,
    isPlaying,
    handlePlayPause,
    handleVideoReady,
    handleVideoEnd,
  };
}
