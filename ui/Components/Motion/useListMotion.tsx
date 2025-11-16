import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMotionConfig } from './useMotionConfig';
import { ListMotionProps } from './types';

/**
 * Hook for list animations with staggered delays
 * Handles empty states and item transitions
 */
export function useListMotion(items: readonly any[], options?: {
  staggerDelay?: number;
  variant?: string;
  disabled?: boolean;
}) {
  const { getVariant, isAnimationEnabled } = useMotionConfig();
  const { staggerDelay = 0.1, variant = 'fade', disabled = false } = options || {};

  const listMotionProps = useMemo(() => {
    if (disabled || !isAnimationEnabled()) {
      return {
        containerVariants: {
          initial: {},
          animate: {},
          exit: {},
        },
        itemVariants: {
          initial: {},
          animate: {},
          exit: {},
        },
        transition: { duration: 0 },
        staggerDelay: 0,
      };
    }

    const baseVariant = getVariant(variant as any);

    // Create staggered variants for list items
    const containerVariants = {
      initial: {},
      animate: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
      exit: {
        transition: {
          staggerChildren: staggerDelay / 2, // Faster exit animations
          staggerDirection: -1, // Exit in reverse order
        },
      },
    };

    const itemVariants = {
      initial: baseVariant.initial,
      animate: baseVariant.animate,
      exit: baseVariant.exit,
    };

    return {
      containerVariants,
      itemVariants,
      transition: baseVariant.transition,
      staggerDelay,
    };
  }, [variant, staggerDelay, disabled, isAnimationEnabled, getVariant]);

  return {
    listMotionProps,
    isAnimationEnabled: isAnimationEnabled() && !disabled,
    motion,
    AnimatePresence,
  };
}

/**
 * Component version for simpler list animations
 */
export function ListMotion({
  children,
  items,
  staggerDelay = 0.1,
  variant = 'fade',
  className = ''
}: ListMotionProps) {
  const { listMotionProps, isAnimationEnabled, AnimatePresence } = useListMotion(items, {
    staggerDelay,
    variant,
  });

  if (!isAnimationEnabled) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {typeof children === 'function' ? children(item, index) : children}
          </div>
        ))}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={listMotionProps.containerVariants}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            variants={listMotionProps.itemVariants}
            transition={listMotionProps.transition}
          >
            {typeof children === 'function' ? children(item, index) : children}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}