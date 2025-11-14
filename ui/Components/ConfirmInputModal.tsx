import React, { useState, useEffect } from 'react';
import { Modal, Input, Alert } from 'antd';
import { WarningOutlined } from '@ant-design/icons';


interface IConfirmInputModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  warningMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  okText?: string;
  cancelText?: string;
  okButtonProps?: {
    danger?: boolean;
  };
}

/**
 * ConfirmInputModal - Reusable confirmation modal requiring user to type specific text
 *
 * Use this for dangerous actions that need extra confirmation.
 * User must type the exact confirmText (case-insensitive) to enable the confirm button.
 *
 * @example
 * <ConfirmInputModal
 *   visible={showModal}
 *   title="Delete Folder"
 *   description="This will permanently delete all documents."
 *   confirmText="DELETE"
 *   warningMessage="This action cannot be undone!"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowModal(false)}
 * />
 */
function ConfirmInputModal({
  visible,
  title,
  description,
  confirmText,
  warningMessage,
  onConfirm,
  onCancel,
  loading = false,
  okText = 'Confirm',
  cancelText = 'Cancel',
  okButtonProps,
}: IConfirmInputModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Reset input when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setInputValue('');
      setIsValid(false);
    }
  }, [visible]);

  // Validate input against confirmText (case-insensitive)
  useEffect(() => {
    setIsValid(inputValue.toLowerCase() === confirmText.toLowerCase());
  }, [inputValue, confirmText]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  return (
    <Modal
      title={
        <span>
          <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          {title}
        </span>
      }
      open={visible}
      onOk={handleConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{
        disabled: !isValid,
        danger: okButtonProps?.danger ?? true,
        loading,
      }}
      closable={!loading}
      maskClosable={!loading}
      keyboard={!loading}
    >
      <div style={{ marginBottom: 16 }}>
        <span>{description}</span>
      </div>

      {warningMessage && (
        <Alert
          message={warningMessage}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div>
        <span className="font-bold">
          Type <span className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{confirmText}</span> to confirm:
        </span>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Type ${confirmText} here`}
          disabled={loading}
          onPressEnter={handleConfirm}
          autoFocus
          style={{ marginTop: 8 }}
        />
      </div>
    </Modal>
  );
}

export default ConfirmInputModal;
