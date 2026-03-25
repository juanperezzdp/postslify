import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type NavItemProps = {
  href: string;
  icon: IconDefinition;
  label: string;
  isActive?: boolean;
  onboardingId?: string;
  onClick?: () => void;
};

export type ActionItemProps = {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  onboardingId?: string;
};

export type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};
