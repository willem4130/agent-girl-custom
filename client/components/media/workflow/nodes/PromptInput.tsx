
import { memo, useRef, useCallback, useState, useEffect } from "react";

const MIN_HEIGHT = 60;
const MAX_HEIGHT = 120;

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PromptInput = memo(function PromptInput({
  value,
  onChange,
  placeholder = "Describe what you want to generate...",
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      const newValue = textarea.value;
      setLocalValue(newValue);
      onChange(newValue);

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set new height, capped at MAX_HEIGHT
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, MIN_HEIGHT),
        MAX_HEIGHT
      );
      textarea.style.height = `${newHeight}px`;
    },
    [onChange]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Stop propagation to prevent React Flow zoom
    e.stopPropagation();
  }, []);

  // Auto-resize on mount if there's content
  useEffect(() => {
    if (textareaRef.current && localValue) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, MIN_HEIGHT),
        MAX_HEIGHT
      );
      textarea.style.height = `${newHeight}px`;
    }
  }, [localValue]);

  return (
    <textarea
      ref={textareaRef}
      className="nodrag nowheel w-full resize-none overflow-y-auto rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30"
      style={{
        backgroundColor: "rgb(31, 31, 35)",
        minHeight: MIN_HEIGHT,
        maxHeight: MAX_HEIGHT,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      placeholder={placeholder}
      value={localValue}
      onChange={handleInput}
      onWheel={handleWheel}
    />
  );
});
