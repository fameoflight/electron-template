import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TabVariant, tabVariants, TabVariantConfig } from './variants';
import { tabMotionVariants } from '../Motion/variants';

export interface TabProps<T = string> {
  key: T;
  label: React.ReactNode;
  description?: React.ReactNode | null;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  isActive: boolean;
  onClick?: () => void;
  href?: string; // for Link components
  className?: string;
  variant?: TabVariant;
  motionVariant?: 'pills' | 'glow' | 'neon' | 'minimalScale';
}

function Tab<T extends string>({
  key,
  label,
  description,
  icon,
  badge,
  disabled = false,
  isActive,
  onClick,
  href,
  className = '',
  variant = 'bordered',
  motionVariant
}: TabProps<T>) {
  const variantConfig = tabVariants[variant];
  const selectedMotionVariant = motionVariant || variantConfig.motionVariant;
  // Render tab content with icon and badge
  const renderTabContent = () => (
    <span className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
          {badge}
        </span>
      )}
    </span>
  );

  // Build CSS classes based on variant and state
  const tabClasses = [
    variantConfig.baseClasses,
    isActive ? variantConfig.activeClasses : variantConfig.inactiveClasses,
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className
  ].filter(Boolean).join(' ');

  // Animation props
  const animationProps = !disabled ? {
    whileHover: { scale: variantConfig.hoverScale },
    whileTap: { scale: variantConfig.tapScale },
  } : {};

  // Handle pills style with motion variants
  if (selectedMotionVariant && tabMotionVariants[selectedMotionVariant]) {
    const motionVariants = tabMotionVariants[selectedMotionVariant];

    return (
      <motion.div
        key={String(key)}
        onClick={() => !disabled && onClick?.()}
        className={tabClasses}
        variants={motionVariants}
        animate={isActive ? 'active' : 'inactive'}
        initial="inactive"
        {...animationProps}
      >
        {renderTabContent()}
      </motion.div>
    );
  }

  // Handle all other variants
  return (
    <motion.div
      key={String(key)}
      onClick={() => !disabled && onClick?.()}
      className={tabClasses}
      {...animationProps}
    >
      {renderTabContent()}
    </motion.div>
  );
}

export default Tab;