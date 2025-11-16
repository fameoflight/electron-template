import React from 'react';
import { motion } from 'framer-motion';
import { useMotionConfig } from './useMotionConfig';
import { MotionWrapperProps } from './types';

/**
 * MotionWrapper provides a clean interface for applying motion animations
 * to any component while respecting global motion configuration.
 */
export function MotionWrapper({
  children,
  variant = 'fade',
  customConfig,
  className = '',
  motionKey,
  disabled = false,
}: MotionWrapperProps) {
  const { getVariant, isAnimationEnabled } = useMotionConfig();

  // If animations are disabled or explicitly disabled, render without motion
  if (disabled || !isAnimationEnabled()) {
    return (
      <div className={className} key={motionKey}>
        {children}
      </div>
    );
  }

  // Use custom config if provided, otherwise use variant
  const motionProps = customConfig ? {
    initial: customConfig.initial || {},
    animate: customConfig.animate || {},
    exit: customConfig.exit || {},
    transition: customConfig.transition || { duration: 0.2 },
  } : getVariant(variant);

  return (
    <motion.div
      key={motionKey}
      className={className}
      initial={motionProps.initial}
      animate={motionProps.animate}
      exit={motionProps.exit}
      transition={motionProps.transition}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hook-based version of MotionWrapper for more flexible usage
 */
export function useMotionWrapper(variant: string = 'fade', disabled?: boolean) {
  const { getVariant, isAnimationEnabled } = useMotionConfig();

  const getMotionProps = (customConfig?: MotionWrapperProps['customConfig']) => {
    if (disabled || !isAnimationEnabled()) {
      return {
        initial: {},
        animate: {},
        exit: {},
        transition: { duration: 0 },
      };
    }

    return customConfig ? {
      initial: customConfig.initial || {},
      animate: customConfig.animate || {},
      exit: customConfig.exit || {},
      transition: customConfig.transition || { duration: 0.2 },
    } : getVariant(variant as any);
  };

  return {
    getMotionProps,
    isAnimationEnabled: isAnimationEnabled() && !disabled,
    motion, // Provide motion component for custom implementations
  };
}

export default MotionWrapper;