import React from 'react';
import { motion } from '@ui/Components/Motion';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ISettingsPageHeaderProps {
  title: string;
  subtitle: string;
  isShowingForm: boolean;
  isEdit?: boolean;
  onAdd?: () => void;
  onBack?: () => void;
  addButtonText?: string;
}

function SettingsPageHeader(props: ISettingsPageHeaderProps) {
  const {
    title,
    subtitle,
    isShowingForm,
    isEdit = false,
    onAdd,
    onBack,
    addButtonText = 'Add Item'
  } = props;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">
          {title}
        </h2>
        <p className="text-sm text-secondary mt-1">
          {subtitle}
        </p>
      </div>

      {isShowingForm ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdd}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          <PlusIcon className="w-4 h-4" />
          {addButtonText}
        </motion.button>
      )}
    </div>
  );
}

export default React.memo(SettingsPageHeader);