
import { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { useEdges, useNodes, useReactFlow } from "@xyflow/react";
import BaseNode from "./BaseNode";
import { downloadMedia } from "./MediaSaveOverlay";
import type { VideoConcatNodeData, TransitionType } from "../types";
import { getContainerHeight, NODE_WIDTH } from "../utils/aspectRatio";

// Transition options with labels and categories
const TRANSITION_OPTIONS: {
  value: TransitionType;
  label: string;
  category: string;
  duration: number;
}[] = [
  // None (default - just concatenate without any transition)
  { value: "none", label: "None", category: "None", duration: 0 },
  // Fast motion transitions (most popular for short-form)
  {
    value: "slideUp",
    label: "Slide Up",
    category: "Fast Motion",
    duration: 0.2,
  },
  {
    value: "slideDown",
    label: "Slide Down",
    category: "Fast Motion",
    duration: 0.2,
  },
  {
    value: "slideLeft",
    label: "Slide Left",
    category: "Fast Motion",
    duration: 0.2,
  },
  {
    value: "slideRight",
    label: "Slide Right",
    category: "Fast Motion",
    duration: 0.2,
  },
  // Quick effects
  { value: "flash", label: "Flash", category: "Quick", duration: 0.15 },
  { value: "glitch", label: "Glitch", category: "Quick", duration: 0.15 },
  // Zoom
  { value: "zoomIn", label: "Zoom In", category: "Zoom", duration: 0.3 },
  { value: "zoomOut", label: "Zoom Out", category: "Zoom", duration: 0.3 },
  // Classic
  {
    value: "crossfade",
    label: "Crossfade",
    category: "Classic",
    duration: 0.5,
  },
  { value: "fade", label: "Fade", category: "Classic", duration: 0.5 },
  { value: "blur", label: "Blur", category: "Classic", duration: 0.4 },
  // Wipe
  { value: "wipeLeft", label: "Wipe Left", category: "Wipe", duration: 0.4 },
  { value: "wipeRight", label: "Wipe Right", category: "Wipe", duration: 0.4 },
];

const DEFAULT_TRANSITION = { type: "none" as TransitionType, duration: 0 };

const ChevronDownIcon = () => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
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

const ConcatIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="6" width="6" height="12" rx="1" />
    <rect x="9" y="6" width="6" height="12" rx="1" />
    <rect x="16" y="6" width="6" height="12" rx="1" />
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

const MIN_INPUTS = 5;
const MAX_INPUTS = 10;

const VideoConcatNode = memo(function VideoConcatNode({
  id,
  data,
  selected,
}: NodeProps<Node<VideoConcatNodeData>>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [duration, setDuration] = useState<string>("0:00");
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null
  );
  const edges = useEdges();
  const nodes = useNodes();
  const { setNodes } = useReactFlow();

  // Dynamic input count (5-10)
  const inputCount = data.inputCount || MIN_INPUTS;
  const canAddInput = inputCount < MAX_INPUTS;

  // Generate dynamic inputs array
  const inputs = useMemo(() => {
    return Array.from({ length: inputCount }, (_, i) => ({
      id: `video${i + 1}`,
      label: `Video ${i + 1}`,
      color: "#EF9092",
    }));
  }, [inputCount]);

  // Handler to add more inputs
  const handleAddInput = useCallback(() => {
    if (inputCount < MAX_INPUTS) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  inputCount: inputCount + 1,
                },
              }
            : node
        )
      );
    }
  }, [id, inputCount, setNodes]);

  // Get connected source nodes and their data
  const connectedSources = useMemo(() => {
    const incomingEdges = edges.filter((edge) => edge.target === id);
    return incomingEdges
      .map((edge) => nodes.find((n) => n.id === edge.source))
      .filter((n): n is Node => n !== undefined);
  }, [edges, nodes, id]);

  // Count connected video inputs
  const connectedInputs = connectedSources.length;

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

  // Calculate minimum height needed to accommodate all input handles + add button
  // Handles start at 65px and are spaced 36px apart
  const minContentHeight = useMemo(() => {
    // Last handle position + handle height + buffer - header height
    // Add extra 36px for the + button if we can add more inputs
    const addButtonSpace = canAddInput ? 36 : 0;
    const handleSpaceNeeded =
      65 + (inputCount - 1) * 36 + 20 + addButtonSpace - 40;
    return Math.max(0, handleSpaceNeeded);
  }, [inputCount, canAddInput]);

  useEffect(() => {
    if (data.videoUrl && videoRef.current) {
      const video = videoRef.current;

      const handleLoadedMetadata = () => {
        const mins = Math.floor(video.duration / 60);
        const secs = Math.floor(video.duration % 60);
        setDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
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

  // Handle transition selection for a specific index
  const handleTransitionSelect = useCallback(
    (
      index: number,
      transitionType: TransitionType,
      transitionDuration: number
    ) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== id) return node;

          const currentTransitions =
            (node.data as VideoConcatNodeData).transitions || [];
          const newTransitions = [...currentTransitions];

          // Ensure array is long enough
          while (newTransitions.length <= index) {
            newTransitions.push({ ...DEFAULT_TRANSITION });
          }

          newTransitions[index] = {
            type: transitionType,
            duration: transitionDuration,
          };

          return {
            ...node,
            data: {
              ...node.data,
              transitions: newTransitions,
            },
          };
        })
      );
      setOpenDropdownIndex(null);
    },
    [id, setNodes]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownIndex !== null) {
        const dropdownEl = dropdownRefs.current[openDropdownIndex];
        if (dropdownEl && !dropdownEl.contains(event.target as HTMLElement)) {
          setOpenDropdownIndex(null);
        }
      }
    };

    if (openDropdownIndex !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdownIndex]);

  // Get transition for a specific index
  const getTransitionAtIndex = useCallback(
    (index: number) => {
      const transitions = data.transitions || [];
      const transition = transitions[index] || DEFAULT_TRANSITION;
      return (
        TRANSITION_OPTIONS.find((t) => t.value === transition.type) ||
        TRANSITION_OPTIONS[0]
      );
    },
    [data.transitions]
  );

  // Number of transitions needed (one between each pair of videos)
  const transitionCount = Math.max(0, connectedInputs - 1);

  return (
    <BaseNode
      label={data.label || "Video Concat"}
      selected={selected}
      inputs={inputs}
      outputs={[{ id: "video", label: "Video", color: "#EF9092" }]}
      isGenerating={data.isGenerating}
      onAddInput={handleAddInput}
      canAddInput={canAddInput}
    >
      <div
        className="flex flex-col gap-3"
        style={{ minHeight: minContentHeight }}
      >
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
                  Concatenating...
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
                {duration}
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
              <ConcatIcon />
              <span className="text-[10px] text-gray-500">
                {connectedInputs > 0
                  ? `${connectedInputs} video${connectedInputs > 1 ? "s" : ""} connected`
                  : "Connect videos to concat"}
              </span>
            </div>
          )}
        </div>

        {/* Settings badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[8px] text-gray-400">
            {detectedAspectRatio}
          </span>

          {/* Dynamic transition selector dropdowns - one per clip pair */}
          {Array.from({ length: transitionCount }).map((_, index) => {
            const currentTransition = getTransitionAtIndex(index);
            const isOpen = openDropdownIndex === index;

            return (
              <div
                key={index}
                className="nodrag relative"
                ref={(el) => {
                  dropdownRefs.current[index] = el;
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownIndex(isOpen ? null : index);
                  }}
                  className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[8px] text-gray-400 transition-colors hover:bg-zinc-700 hover:text-gray-300"
                  title={`Transition ${index + 1} (between clip ${index + 1} and ${index + 2})`}
                >
                  <span className="text-zinc-600">{index + 1}:</span>
                  {currentTransition.label}
                  <ChevronDownIcon />
                </button>

                {isOpen && (
                  <div
                    className="transition-dropdown nowheel absolute top-full left-0 z-50 mt-1 max-h-48 w-32 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-lg"
                    onWheelCapture={(e) => e.stopPropagation()}
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(255,255,255,0.2) transparent",
                    }}
                  >
                    <style>{`
                      .transition-dropdown::-webkit-scrollbar { width: 6px; }
                      .transition-dropdown::-webkit-scrollbar-track { background: transparent; }
                      .transition-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
                      .transition-dropdown::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
                    `}</style>
                    {/* Group by category */}
                    {[
                      "None",
                      "Fast Motion",
                      "Quick",
                      "Zoom",
                      "Classic",
                      "Wipe",
                    ].map((category) => {
                      const categoryOptions = TRANSITION_OPTIONS.filter(
                        (t) => t.category === category
                      );
                      if (categoryOptions.length === 0) return null;

                      return (
                        <div key={category}>
                          <div className="px-2 py-1 text-[7px] font-medium tracking-wider text-zinc-500 uppercase">
                            {category}
                          </div>
                          {categoryOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransitionSelect(
                                  index,
                                  option.value,
                                  option.duration
                                );
                              }}
                              className={`w-full px-2 py-1 text-left text-[9px] transition-colors hover:bg-zinc-800 ${
                                currentTransition.value === option.value
                                  ? "bg-zinc-800 text-white"
                                  : "text-gray-400"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BaseNode>
  );
});

export default VideoConcatNode;
