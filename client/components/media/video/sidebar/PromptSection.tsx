
import { useRef, useCallback } from "react";
import { EnhanceIcon } from "../icons";

interface PromptSectionProps {
  prompt: string;
  maxLength: number;
  enhanceEnabled: boolean;
  supportsPromptEnhancement: boolean;
  onPromptChange: (prompt: string) => void;
  onEnhanceToggle: () => void;
}

export default function PromptSection({
  prompt,
  maxLength,
  enhanceEnabled,
  supportsPromptEnhancement,
  onPromptChange,
  onEnhanceToggle,
}: PromptSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, []);

  return (
    <fieldset className="rounded-xl border border-white/10 bg-white/5">
      <label className="relative block p-3 pb-1">
        <span className="mb-1 text-sm font-medium text-zinc-300">
          Prompt
          <span className="ml-2 text-xs text-zinc-400">
            {prompt.length}/{maxLength}
          </span>
        </span>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onInput={handleTextareaInput}
          className="hide-scrollbar w-full resize-none overflow-y-auto border-none bg-transparent text-sm text-white placeholder:text-zinc-400 focus:outline-none"
          placeholder="Describe the scene you imagine, with details."
          style={{ height: "60px", maxHeight: "120px" }}
          maxLength={maxLength}
        />
      </label>
      <div className="flex flex-wrap gap-1 p-3 pt-0">
        {supportsPromptEnhancement && (
          <label
            className={`flex h-6 w-fit cursor-pointer items-center justify-center gap-1 rounded-md border border-transparent px-2 py-1 whitespace-nowrap transition-colors select-none ${
              enhanceEnabled ? "text-white" : "text-white/80 hover:text-white"
            }`}
            onClick={onEnhanceToggle}
          >
            <EnhanceIcon />
            <span className="text-xs font-medium">
              Enhance {enhanceEnabled ? "on" : "off"}
            </span>
          </label>
        )}
      </div>
    </fieldset>
  );
}
