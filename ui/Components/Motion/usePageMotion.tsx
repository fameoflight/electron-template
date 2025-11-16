import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMotionConfig } from './useMotionConfig';
import { PageMotionProps } from './types';

/**
 * Hook for page transition animations
 * Handles direction-aware animations and route-based keys
 */
export function usePageMotion(routeKey: string, options?: {
  variant?: string;
  direction?: 'forward' | 'backward';
  disabled?: boolean;
}) {
  const { getVariant, isAnimationEnabled } = useMotionConfig();
  const { variant = 'slide', direction = 'forward', disabled = false } = options || {};

  const pageMotionProps = useMemo(() => {
    if (disabled || !isAnimationEnabled()) {
      return {
        initial: {},
        animate: {},
        exit: {},
        transition: { duration: 0 },
        key: routeKey,
      };
    }

    const baseVariant = getVariant(variant as any);

    // Adjust animation based on direction
    let adjustedVariant = { ...baseVariant };

    if (variant === 'slide' && direction === 'backward') {
      // Reverse the slide direction for back navigation
      adjustedVariant = {
        ...baseVariant,
        initial: { x: -100, opacity: 0 },
        exit: { x: 100, opacity: 0 },
      };
    }

    return {
      ...adjustedVariant,
      key: routeKey,
    };
  }, [variant, direction, disabled, isAnimationEnabled, getVariant, routeKey]);

  return {
    pageMotionProps,
    isAnimationEnabled: isAnimationEnabled() && !disabled,
    motion, // For custom page motion components
  };
}

/**
 * Component version of page motion for easier usage
 */
export function PageMotion({ children, routeKey, variant, direction }: PageMotionProps) {
  const { pageMotionProps, motion } = usePageMotion(routeKey, { variant, direction });
  return <motion.div {...pageMotionProps}>{children}</motion.div>;
}