export type MotionVariant = 'slide' | 'fade' | 'scale' | 'flip' | 'bounce';

export interface MotionConfig {
  initial: any;
  animate: any;
  exit: any;
  transition: any;
}

export const motionVariants: Record<MotionVariant, MotionConfig> = {
  // Slide variants (like original AdvanceTabs)
  slide: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
    transition: { type: 'tween', duration: 0.3 }
  },

  // Fade variants
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { type: 'tween', duration: 0.2 }
  },

  // Scale variants
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { type: 'tween', duration: 0.2 }
  },

  // Flip variants
  flip: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
    transition: { type: 'tween', duration: 0.4 }
  },

  // Bounce variants
  bounce: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  }
};

// Tab-specific motion variants for pills style
export interface TabMotionConfig {
  active: any;
  inactive: any;
  [key: string]: any; // Index signature for Framer Motion Variants compatibility
}

export const tabMotionVariants: Record<string, TabMotionConfig> = {
  // Default pills style
  pills: {
    active: {
      backgroundColor: 'var(--ant-primary-color-disabled)',
      color: 'var(--ant-primary-9)',
      fontWeight: 600,
      scale: 1.05,
      transition: { type: 'tween', duration: 0.3 }
    },
    inactive: {
      backgroundColor: '#fff',
      color: '#9CA3AF',
      fontWeight: 400,
      scale: 1,
      transition: { type: 'tween', duration: 0.3 }
    }
  },

  // Glow effect
  glow: {
    active: {
      backgroundColor: 'var(--ant-primary-color)',
      color: '#fff',
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
      transition: { type: 'tween', duration: 0.3 }
    },
    inactive: {
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
      boxShadow: 'none',
      transition: { type: 'tween', duration: 0.3 }
    }
  },

  // Neon effect
  neon: {
    active: {
      backgroundColor: '#1f2937',
      color: '#60a5fa',
      border: '1px solid #60a5fa',
      boxShadow: '0 0 15px rgba(96, 165, 250, 0.5)',
      transition: { type: 'tween', duration: 0.3 }
    },
    inactive: {
      backgroundColor: '#374151',
      color: '#9ca3af',
      border: '1px solid #4b5563',
      boxShadow: 'none',
      transition: { type: 'tween', duration: 0.3 }
    }
  },

  // Minimal scale
  minimalScale: {
    active: {
      scale: 1.1,
      fontWeight: 600,
      transition: { type: 'tween', duration: 0.2 }
    },
    inactive: {
      scale: 1,
      fontWeight: 400,
      transition: { type: 'tween', duration: 0.2 }
    }
  }
};