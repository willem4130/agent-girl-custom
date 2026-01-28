
import { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { useEdges, useNodes } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { downloadMedia } from "./MediaSaveOverlay";
import { InputBadge, StaticBadge } from "./NodeBadges";
import { useNodeUpdate } from "./useNodeUpdate";
import type { VideoTrimNodeData } from "../types";
import { getContainerHeight, NODE_WIDTH } from "../utils/aspectRatio";

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

const TrimIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const VideoIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    className="animate-pulse text-zinc-500"
  >
    <path
      d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z"
      fill="currentColor"
    />
  </svg>
);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const VideoTrimNode = memo(function VideoTrimNode({
  id,
  data,
  selected,
}: NodeProps<Node<VideoTrimNodeData>>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoDuration, setVideoDuration] = useState<string>("0:00");
  const edges = useEdges();
  const nodes = useNodes();
  const updateData = useNodeUpdate(id);

  // Get connected source nodes
  const connectedSources = useMemo(() => {
    const incomingEdges = edges.filter((edge) => edge.target === id);
    return incomingEdges
      .map((edge) => nodes.find((n) => n.id === edge.source))
      .filter((n): n is Node => n !== undefined);
  }, [edges, nodes, id]);

  // Detect aspect ratio from first connected source node
  const detectedAspectRatio = useMemo(() => {
    if (connectedSources.length > 0) {
      const firstSource = connectedSources[0];
      const sourceData = firstSource.data as { aspectRatio?: string };
      if (sourceData.aspectRatio) {
        return sourceData.aspectRatio;
      }
    }
    return data.aspectRatio || "16:9";
  }, [connectedSources, data.aspectRatio]);

  // Calculate container height based on detected aspect ratio
  const containerHeight = useMemo(
    () => getContainerHeight(detectedAspectRatio, NODE_WIDTH),
    [detectedAspectRatio]
  );

  useEffect(() => {
    if (data.videoUrl && videoRef.current) {
      const video = videoRef.current;

      const handleLoadedMetadata = () => {
        const mins = Math.floor(video.duration / 60);
        const secs = Math.floor(video.duration % 60);
        setVideoDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
      };

      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () =>
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    }
  }, [data.videoUrl]);

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

  // Calculate trimmed duration
  const trimmedDuration = useMemo(() => {
    const start = data.startTime || 0;
    const end = data.endTime || 0;
    if (end > start) {
      return formatTime(end - start);
    }
    return videoDuration;
  }, [data.startTime, data.endTime, videoDuration]);

  return (
    <BaseNode
      label={data.label || "Trim"}
      selected={selected}
      inputs={[{ id: "video", label: "Video", color: "#EF9092" }]}
      outputs={[{ id: "video", label: "Video", color: "#EF9092" }]}
      isGenerating={data.isGenerating}
    >
      <div className="flex flex-col gap-3">
        {/* Output Container */}
        <div
          className="nodrag relative w-full overflow-hidden rounded-lg transition-all duration-300"
          style={{
            backgroundColor: "rgb(31, 31, 35)",
            height: containerHeight,
          }}
        >
          {data.isGenerating ? (
            <div className="skeleton-loader flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <VideoIcon />
                <span className="animate-pulse text-[10px] text-zinc-500">
                  Trimming...
                </span>
              </div>
            </div>
          ) : data.videoUrl ? (
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
                  <button
                    onClick={togglePlayback}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
                  >
                    <PlayIcon />
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-110 hover:bg-white/30"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </div>
              <div className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] text-white">
                {videoDuration}
              </div>
            </div>
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2"
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
              <TrimIcon />
              <span className="text-[10px] text-gray-500">No output yet</span>
            </div>
          )}
        </div>

        {/* Settings badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StaticBadge label={detectedAspectRatio} />
          <InputBadge
            value={data.startTime || 0}
            onChange={(v) => updateData("startTime", v)}
            prefix="Start: "
            suffix="s"
            min={0}
            step={0.1}
            formatValue={formatTime}
          />
          <InputBadge
            value={data.endTime || 0}
            onChange={(v) => updateData("endTime", v)}
            prefix="End: "
            suffix="s"
            min={0}
            step={0.1}
            formatValue={formatTime}
          />
          <StaticBadge label={trimmedDuration} />
        </div>
      </div>
    </BaseNode>
  );
});

export default VideoTrimNode;
