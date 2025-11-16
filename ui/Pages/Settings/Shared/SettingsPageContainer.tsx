import React from 'react';
import { motion, AnimatePresence } from '@ui/Components/Motion';

interface ISettingsPageContainerProps {
  title: string;
  subtitle: string;
  isShowingForm: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

function SettingsPageContainer(props: ISettingsPageContainerProps) {
  const { title, subtitle, isShowingForm, onBack, children, maxWidth = 'max-w-7xl' } = props;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className={`${maxWidth} mx-auto`}>
        <AnimatePresence mode="wait">
          {isShowingForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default React.memo(SettingsPageContainer);