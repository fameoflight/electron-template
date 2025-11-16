import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMotionConfig as useMotionConfigContext } from './MotionProvider';
import { MotionVariant } from './types';

/**
 * Hook for accessing motion configuration throughout the app
 */
export function useMotionConfig() {
  return useMotionConfigContext();
}

/**
 * Hook for getting motion props based on variant
 */
export function useMotionProps(variant: MotionVariant, disabled?: boolean) {
  const { getVariant, isAnimationEnabled } = useMotionConfigContext();

  const motionProps = useCallback(() => {
    if (disabled || !isAnimationEnabled()) {
      return {
        initial: {},
        animate: {},
        exit: {},
        transition: { duration: 0 },
      };
    }

    const variantConfig = getVariant(variant);
    return {
      initial: variantConfig.initial,
      animate: variantConfig.animate,
      exit: variantConfig.exit,
      transition: variantConfig.transition,
    };
  }, [variant, disabled, getVariant, isAnimationEnabled]);

  return {
    motionProps: motionProps(),
    isAnimationEnabled: isAnimationEnabled() && !disabled,
    motion, // Export motion component for convenience
  };
}

/**
 * Hook for monitoring motion preferences
 */
export function useMotionPreferences() {
  const { config } = useMotionConfigContext();

  return {
    animationsEnabled: config.animationsEnabled,
    reducedMotion: config.reducedMotion,
    respectReducedMotion: config.respectReducedMotion,
    isLowEndDeviceMode: !config.enableAnimationsOnLowEndDevices,
  };
}