
import { createPortal } from "react-dom";
import { useDropdownPosition } from "@/hooks/useDropdownPosition";
import { DropdownCheckIcon } from "./DropdownIcons";
import type { BaseDropdownProps } from "./types";

interface SimpleDropdownProps extends BaseDropdownProps {
  options: { id: string; label: string }[];
}

export function SimpleDropdown({
  options,
  value,
  onChange,
  isOpen,
  onClose,
  triggerRef,
}: SimpleDropdownProps) {
  const { dropdownRef, position, isPositioned } = useDropdownPosition({
    isOpen,
    triggerRef,
    onClose,
  });

  if (!isOpen || !isPositioned) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-[9999] w-40 rounded-2xl border border-zinc-700 bg-zinc-800 p-2 shadow-xl"
    >
      <div className="flex flex-col gap-1">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              onChange(option.id);
              onClose();
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors outline-none hover:bg-white/5 ${
              value === option.id ? "bg-white/10" : ""
            }`}
          >
            <span className="text-sm font-medium text-white">
              {option.label}
            </span>
            {value === option.id && <DropdownCheckIcon />}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
