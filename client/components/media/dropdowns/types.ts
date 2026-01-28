export interface DropdownBadge {
  label: string;
  icon?: React.ReactNode;
}

export interface DropdownOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badges?: (string | DropdownBadge)[];
}

export interface NestedDropdownGroup {
  id: string;
  label: string;
  icon?: React.ReactNode;
  options: DropdownOption[];
}

export interface BaseDropdownProps {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}
