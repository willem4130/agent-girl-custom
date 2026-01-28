export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  model: string;
  duration: number;
  aspectRatio: string;
  resolution?: string;
  startImageUrl?: string;
  endImageUrl?: string;
  motionVideoUrl?: string;
  audioEnabled?: boolean;
  createdAt: string;
}
