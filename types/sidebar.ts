import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type NavItemProps = {
  href: string;
  icon: IconDefinition;
  label: string;
  isActive?: boolean;
};

export type ActionItemProps = {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
};

export type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};
