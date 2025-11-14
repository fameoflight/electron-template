export type TabVariant = 'bordered' | 'pills' | 'underline' | 'minimal';

export interface TabVariantConfig {
  // Visual style
  baseClasses: string;
  activeClasses: string;
  inactiveClasses: string;

  // Animation
  hoverScale?: number;
  tapScale?: number;

  // Motion variant for pills style
  motionVariant?: 'pills' | 'glow' | 'neon' | 'minimalScale';
}

export const tabVariants: Record<TabVariant, TabVariantConfig> = {
  // Bordered style - classic router tabs with bottom border
  bordered: {
    baseClasses: 'py-2 px-1 font-medium text-sm transition-colors whitespace-nowrap border-b-2',
    activeClasses: 'border-blue-500 text-blue-600',
    inactiveClasses: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    hoverScale: 1.02,
    tapScale: 0.98,
  },

  // Pills style - rounded background like AdvanceTabs/TailwindTabs
  pills: {
    baseClasses: 'px-3 py-2 font-medium text-sm rounded-md cursor-pointer transition-all',
    activeClasses: '', // Handled by motion variants
    inactiveClasses: '', // Handled by motion variants
    hoverScale: 1.05,
    tapScale: 0.95,
    motionVariant: 'pills',
  },

  // Underline style - simple underline accent
  underline: {
    baseClasses: 'py-2 px-3 font-medium text-sm transition-colors whitespace-nowrap',
    activeClasses: 'text-blue-600 border-b-2 border-blue-500',
    inactiveClasses: 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-400',
    hoverScale: 1.01,
    tapScale: 0.99,
  },

  // Minimal style - very subtle, text only
  minimal: {
    baseClasses: 'py-2 px-3 text-sm transition-colors whitespace-nowrap',
    activeClasses: 'text-gray-900 font-semibold',
    inactiveClasses: 'text-gray-500 hover:text-gray-700',
    hoverScale: 1.01,
    tapScale: 0.99,
  },
};