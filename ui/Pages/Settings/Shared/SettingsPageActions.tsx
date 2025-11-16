import React from 'react';

interface ISettingsPageActionsProps {
  isLoading?: boolean;
  isEdit?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
}

function SettingsPageActions(props: ISettingsPageActionsProps) {
  const {
    isLoading = false,
    isEdit = false,
    onSave,
    onCancel,
    saveText = isEdit ? 'Update' : 'Create',
    cancelText = 'Cancel'
  } = props;

  return (
    <div className="flex gap-3 mt-6 pt-6 border-t border-border-default">
      <button
        onClick={onSave}
        disabled={isLoading}
        className="btn-primary flex-1 px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 hover:opacity-90"
      >
        {isLoading ? 'Saving...' : saveText}
      </button>
      <button
        onClick={onCancel}
        className="btn-secondary px-4 py-3 rounded-lg font-medium transition-colors duration-150 hover:opacity-80"
      >
        {cancelText}
      </button>
    </div>
  );
}

export default React.memo(SettingsPageActions);