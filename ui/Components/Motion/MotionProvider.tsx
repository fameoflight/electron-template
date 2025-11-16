import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { motionVariants, tabMotionVariants } from './variants';
import {
  MotionProviderConfig,
  MotionContextType,
  MotionVariant
} from './types';

const defaultConfig: MotionProviderConfig = {
  animationsEnabled: true,
  reducedMotion: false,
  globalDuration: 0.3,
  globalEasing: 'anticipate',
  respectReducedMotion: true,
  respectUserPreferences: true,
  enableAnimationsOnLowEndDevices: false,
  maxConcurrentAnimations: 10,
  defaultPageVariant: 'slide',
  defaultListVariant: 'fade',
  defaultTabVariant: 'pills',
};

const MotionContext = createContext<MotionContextType | null>(null);

export function useMotionConfig() {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useMotionConfig must be used within a MotionProvider');
  }
  return context;
}

interface MotionProviderProps {
  children: React.ReactNode;
  config?: Partial<MotionProviderConfig>;
}

export function MotionProvider({ children, config: initialConfig = {} }: MotionProviderProps) {
  const [config, setConfig] = useState<MotionProviderConfig>(() => ({
    ...defaultConfig,
    ...initialConfig,
  }));

  // Check for user preferences and system settings
  useEffect(() => {
    if (!config.respectUserPreferences) return;

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shouldReduceMotion = mediaQuery.matches;

    if (shouldReduceMotion && config.respectReducedMotion) {
      setConfig(prev => ({
        ...prev,
        reducedMotion: true,
        animationsEnabled: false,
      }));
    }

    // Check for low-end devices (optional heuristic)
    const checkDevicePerformance = () => {
      const connection = (navigator as any).connection;
      const isLowEnd = connection?.effectiveType === 'slow-2g' ||
        connection?.effectiveType === '2g' ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

      if (isLowEnd && !config.enableAnimationsOnLowEndDevices) {
        setConfig(prev => ({
          ...prev,
          animationsEnabled: false,
          globalDuration: 0.1, // Faster animations for low-end devices
        }));
      }
    };

    checkDevicePerformance();

    // Listen for changes in reduced motion preference
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches && config.respectReducedMotion) {
        setConfig(prev => ({
          ...prev,
          reducedMotion: true,
          animationsEnabled: false,
        }));
      } else {
        setConfig(prev => ({
          ...prev,
          reducedMotion: false,
          animationsEnabled: true,
        }));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config.respectReducedMotion, config.respectUserPreferences, config.enableAnimationsOnLowEndDevices]);

  const updateConfig = useCallback((updates: Partial<MotionProviderConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const isAnimationEnabled = useCallback(() => {
    return config.animationsEnabled && !config.reducedMotion;
  }, [config.animationsEnabled, config.reducedMotion]);

  const getVariant = useCallback((variant: MotionVariant) => {
    const baseVariant = motionVariants[variant];

    if (!isAnimationEnabled()) {
      // Return a no-op variant when animations are disabled
      return {
        initial: {},
        animate: {},
        exit: {},
        transition: { duration: 0 },
      };
    }

    // Apply global duration and easing if not specified in the variant
    const adjustedVariant = {
      ...baseVariant,
      transition: {
        ...baseVariant.transition,
        duration: baseVariant.transition.duration || config.globalDuration,
        ease: baseVariant.transition.ease || config.globalEasing,
      },
    };

    return adjustedVariant;
  }, [isAnimationEnabled, config.globalDuration, config.globalEasing]);

  const getTabVariant = useCallback((variant: string) => {
    return tabMotionVariants[variant] || tabMotionVariants[config.defaultTabVariant];
  }, [config.defaultTabVariant]);

  const contextValue: MotionContextType = {
    config,
    updateConfig,
    isAnimationEnabled,
    getVariant,
    getTabVariant,
  };

  return (
    <MotionContext.Provider value={contextValue}>
      {children}
    </MotionContext.Provider>
  );
}