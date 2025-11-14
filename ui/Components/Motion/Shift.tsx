import React from 'react';
import { motion } from 'framer-motion';
import _ from 'lodash';
import { MotionVariant, motionVariants } from './variants';

export interface ShiftProps {
  children: React.ReactNode;
  motionKey?: string | number;
  variant?: MotionVariant;
  values?: {
    x?: number | string;
    y?: number | string;
  };
  transition?: { duration: number };
  className?: string;
}

function Shift({
  children,
  motionKey,
  variant = 'slide',
  values,
  transition,
  className = ''
}: ShiftProps) {
  // Use predefined variant or custom values
  let motionConfig = motionVariants[variant];

  if (values) {
    // Custom motion values (like original Motion.shift)
    const x = values.x || 0;
    const y = values.y || 0;
    const negativeX = _.isNumber(x) ? -x : x;
    const negativeY = _.isNumber(y) ? -y : y;

    motionConfig = {
      initial: { x, y, opacity: 0 },
      animate: { x: 0, y: 0, opacity: 1 },
      exit: { x: negativeX, y: negativeY, opacity: 0 },
      transition: transition || { duration: 0.3 }
    };
  }

  return (
    <motion.div
      key={motionKey}
      initial={motionConfig.initial}
      animate={motionConfig.animate}
      exit={motionConfig.exit}
      transition={motionConfig.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Shift;