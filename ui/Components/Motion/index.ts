// Core provider and context
export { MotionProvider, useMotionConfig } from './MotionProvider';

// Utility hooks
export { useMotionConfig as useMotionConfigHook, useMotionProps, useMotionPreferences } from './useMotionConfig';
export { usePageMotion, PageMotion } from './usePageMotion';
export { useListMotion, ListMotion } from './useListMotion';

// Components
export { MotionWrapper, useMotionWrapper } from './MotionWrapper';

// Re-export Framer Motion components
export { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// Legacy exports (for backward compatibility)
export { default as Shift } from './Shift';

// Export types from variants
export type { MotionVariant, MotionConfig, TabMotionConfig } from './variants';
export { motionVariants, tabMotionVariants } from './variants';

// Export types from types file
export type {
  MotionProviderConfig,
  MotionContextType,
  MotionWrapperProps,
  ListMotionProps,
  PageMotionProps,
} from './types';

// Export Shift props
export type { ShiftProps } from './Shift';