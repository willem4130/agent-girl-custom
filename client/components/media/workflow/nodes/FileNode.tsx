
import { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";

import BaseNode from "./BaseNode";
import MediaSaveOverlay, { downloadMedia } from "./MediaSaveOverlay";
import type { FileNodeData } from "../types";
import { useFileUpload } from "@/hooks/useFileUpload";
import { getContainerHeight, NODE_WIDTH } from "../utils/aspectRatio";

const UploadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const UploadIconSmall = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const LibraryIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const FileIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const FileNode = memo(function FileNode({
  id,
  data,
  selected,
}: NodeProps<Node<FileNodeData>>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [duration, setDuration] = useState<string>("0:00");
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<
    string | undefined
  >(data.aspectRatio);
  const { setNodes } = useReactFlow();
  const { upload } = useFileUpload({ category: "workflows" });

  const isVideo = data.fileType === "video";
  const fileUrl = isVideo ? data.videoUrl : data.imageUrl;

  // Calculate container height based on detected aspect ratio
  const containerHeight = useMemo(
    () => getContainerHeight(detectedAspectRatio, NODE_WIDTH),
    [detectedAspectRatio]
  );

  // Helper to normalize aspect ratio to standard format
  const normalizeAspectRatio = useCallback(
    (width: number, height: number): string => {
      const gcd = (a: number, b: number): number =>
        b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(width, height);
      const w = width / divisor;
      const h = height / divisor;

      // Map common ratios to standard names
      const ratio = width / height;
      if (Math.abs(ratio - 16 / 9) < 0.01) return "16:9";
      if (Math.abs(ratio - 9 / 16) < 0.01) return "9:16";
      if (Math.abs(ratio - 4 / 3) < 0.01) return "4:3";
      if (Math.abs(ratio - 3 / 4) < 0.01) return "3:4";
      if (Math.abs(ratio - 1) < 0.01) return "1:1";
      if (Math.abs(ratio - 21 / 9) < 0.01) return "21:9";

      return `${w}:${h}`;
    },
    []
  );

  // Update node data with detected aspect ratio
  const updateNodeAspectRatio = useCallback(
    (ratio: string) => {
      setDetectedAspectRatio(ratio);
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, aspectRatio: ratio } }
            : node
        )
      );
    },
    [id, setNodes]
  );

  // Detect aspect ratio from video
  useEffect(() => {
    if (data.videoUrl && videoRef.current) {
      const video = videoRef.current;

      const handleLoadedMetadata = () => {
        const mins = Math.floor(video.duration / 60);
        const secs = Math.floor(video.duration % 60);
        setDuration(`${mins}:${secs.toString().padStart(2, "0")}`);

        // Detect aspect ratio from video dimensions
        if (video.videoWidth && video.videoHeight) {
          const ratio = normalizeAspectRatio(
            video.videoWidth,
            video.videoHeight
          );
          updateNodeAspectRatio(ratio);
        }
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () =>
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    }
  }, [data.videoUrl, normalizeAspectRatio, updateNodeAspectRatio]);

  // Detect aspect ratio from image
  useEffect(() => {
    if (data.imageUrl && !isVideo) {
      const img = new window.Image();
      img.onload = () => {
        if (img.width && img.height) {
          const ratio = normalizeAspectRatio(img.width, img.height);
          updateNodeAspectRatio(ratio);
        }
      };
      img.src = data.imageUrl;
    }
  }, [data.imageUrl, isVideo, normalizeAspectRatio, updateNodeAspectRatio]);

  // Reset aspect ratio when file is cleared
  // Use ref to track previous fileUrl and queue state update asynchronously
  const prevFileUrlRef = useRef(fileUrl);
  useEffect(() => {
    if (prevFileUrlRef.current && !fileUrl) {
      // File was cleared (went from truthy to falsy)
      // Queue state updates asynchronously to avoid cascading renders
      setTimeout(() => {
        setDetectedAspectRatio(undefined);
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? { ...node, data: { ...node.data, aspectRatio: undefined } }
              : node
          )
        );
      }, 0);
    }
    prevFileUrlRef.current = fileUrl;
  }, [fileUrl, id, setNodes]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isVideoFile = file.type.startsWith("video/");
      const isImageFile = file.type.startsWith("image/");

      if (!isVideoFile && !isImageFile) return;

      setIsUploading(true);
      const url = await upload(file);
      setIsUploading(false);

      if (url) {
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    fileType: isVideoFile ? "video" : "image",
                    videoUrl: isVideoFile ? url : undefined,
                    imageUrl: isImageFile ? url : undefined,
                    fileName: file.name,
                  },
                }
              : node
          )
        );
      }
    },
    [id, setNodes, upload]
  );

  const togglePlayback = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.videoUrl) {
        await downloadMedia(data.videoUrl, "video");
      }
    },
    [data.videoUrl]
  );

  // Determine outputs based on file type
  const outputs = isVideo
    ? [{ id: "video", label: "Video", color: "#EF9092" }]
    : data.imageUrl
      ? [{ id: "image", label: "Image", color: "#F59E0B" }]
      : [
          { id: "image", label: "Image", color: "#F59E0B" },
          { id: "video", label: "Video", color: "#EF9092" },
        ];

  return (
    <BaseNode
      label={data.label || "File"}
      selected={selected}
      inputs={[]}
      outputs={outputs}
    >
      <div className="flex flex-col gap-3">
        {/* Media Container */}
        <div
          className="nodrag relative w-full overflow-hidden rounded-lg transition-all duration-300"
          style={{
            backgroundColor: "rgb(31, 31, 35)",
            height: containerHeight,
          }}
        >
          {fileUrl ? (
            isVideo ? (
              <div
                className="relative h-full w-full"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <video
                  ref={videoRef}
                  src={data.videoUrl}
                  className="h-full w-full object-cover"
                  onClick={togglePlayback}
                  onEnded={handleVideoEnded}
                />
                {/* Overlay - shows when paused or hovered */}
                <div
                  className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor:
                      !isPlaying || isHovered
                        ? "rgba(0, 0, 0, 0.4)"
                        : "transparent",
                    opacity: !isPlaying || isHovered ? 1 : 0,
                    pointerEvents: !isPlaying || isHovered ? "auto" : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Play Button */}
                    <button
                      onClick={togglePlayback}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
                    >
                      <PlayIcon />
                    </button>
                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
                    >
                      <DownloadIcon />
                    </button>
                  </div>
                </div>
                <div className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] text-white">
                  {duration}
                </div>
              </div>
            ) : (
              <MediaSaveOverlay mediaUrl={data.imageUrl!} mediaType="image">
                <img
                  src={data.imageUrl!}
                  alt="Uploaded"
                                   
                 
                  className="object-cover"
                />
              </MediaSaveOverlay>
            )
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #1f1f23 25%, transparent 25%),
                  linear-gradient(-45deg, #1f1f23 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #1f1f23 75%),
                  linear-gradient(-45deg, transparent 75%, #1f1f23 75%)
                `,
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                backgroundColor: "#2b2b2f",
              }}
            >
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="nodrag inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-medium text-cyan-400 backdrop-blur-sm transition-all hover:bg-cyan-400/20 disabled:opacity-50"
              >
                <UploadIcon />
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[8px] text-gray-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
          >
            <UploadIconSmall />
            {isUploading ? "Uploading..." : "Upload"}
          </button>
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[8px] text-gray-300 transition-colors hover:border-zinc-600 hover:text-white">
            <LibraryIcon />
            Library
          </button>
        </div>

        {/* File info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileIcon />
            <span className="max-w-[140px] truncate text-[8px] text-gray-400">
              {data.fileName || "No file selected"}
            </span>
          </div>
          <span className="text-[8px] text-gray-500">
            {isVideo ? "Video" : data.imageUrl ? "Image" : "Any"}
          </span>
        </div>
      </div>
    </BaseNode>
  );
});

export default FileNode;
