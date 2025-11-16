import { MotionVariant, motionVariants, TabMotionConfig, tabMotionVariants, MotionConfig } from './variants';

// Re-export types for use in other files
export type { MotionVariant, MotionConfig } from './variants';

export interface MotionProviderConfig {
  // Global animation settings
  animationsEnabled: boolean;
  reducedMotion: boolean;
  globalDuration: number;
  globalEasing: string;

  // Accessibility settings
  respectReducedMotion: boolean;
  respectUserPreferences: boolean;

  // Performance settings
  enableAnimationsOnLowEndDevices: boolean;
  maxConcurrentAnimations: number;

  // Default variants
  defaultPageVariant: MotionVariant;
  defaultListVariant: MotionVariant;
  defaultTabVariant: string;
}

export interface MotionContextType {
  config: MotionProviderConfig;
  updateConfig: (updates: Partial<MotionProviderConfig>) => void;
  isAnimationEnabled: () => boolean;
  getVariant: (variant: MotionVariant) => MotionConfig;
  getTabVariant: (variant: string) => TabMotionConfig;
}

export interface MotionWrapperProps {
  children: React.ReactNode;
  variant?: MotionVariant;
  customConfig?: {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
  };
  className?: string;
  motionKey?: string | number;
  disabled?: boolean;
}

export interface ListMotionProps {
  children: React.ReactNode | ((item: any, index: number) => React.ReactNode);
  items: readonly any[];
  staggerDelay?: number;
  variant?: MotionVariant;
  className?: string;
}

export interface PageMotionProps {
  children: React.ReactNode;
  routeKey: string;
  variant?: MotionVariant;
  direction?: 'forward' | 'backward';
}