
import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/csrf";

interface UseFileUploadOptions {
  category?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  upload: (file: File) => Promise<string | null>;
  uploadMultiple: (files: File[]) => Promise<string[]>;
  isUploading: boolean;
  error: string | null;
}

export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const { category = "workflows", onSuccess, onError } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("category", category);

        const response = await apiFetch("/api/upload", {
          method: "POST",
          body: formData,
           // 60s timeout for uploads
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const { urls } = await response.json();
        const url = urls[0];

        onSuccess?.(url);
        return url;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [category, onSuccess, onError]
  );

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<string[]> => {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("category", category);

        const response = await apiFetch("/api/upload", {
          method: "POST",
          body: formData,
           // 120s timeout for multiple uploads
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const { urls } = await response.json();
        return urls;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        onError?.(message);
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [category, onError]
  );

  return { upload, uploadMultiple, isUploading, error };
}
