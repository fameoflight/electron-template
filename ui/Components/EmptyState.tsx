import React from 'react';
import { Empty, Button } from 'antd';
import {
  PlusOutlined,
  FolderAddOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  BugOutlined
} from '@ant-design/icons';

interface IEmptyStateProps {
  type: 'no-documents' | 'no-results' | 'no-folders' | 'error' | 'loading';
  onAction?: () => void;
  actionText?: string;
  description?: string;
  className?: string;
}

function EmptyState(props: IEmptyStateProps) {
  const { type, onAction, actionText, description, className } = props;

  const configs = {
    'no-documents': {
      icon: <FileSearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />,
      description: description || 'No documents yet. Start by adding your first document to begin building your knowledge base.',
      buttonText: actionText || 'Add Your First Document',
      buttonIcon: <PlusOutlined />
    },
    'no-results': {
      icon: <FileSearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />,
      description: description || 'No documents match your search criteria. Try adjusting your filters or search terms.',
      buttonText: actionText || 'Clear Filters',
      buttonIcon: undefined
    },
    'no-folders': {
      icon: <FolderAddOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />,
      description: description || 'No synced folders configured. Connect folders to automatically import and index documents.',
      buttonText: actionText || 'Add Your First Folder',
      buttonIcon: <PlusOutlined />
    },
    'error': {
      icon: <BugOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />,
      description: description || 'Something went wrong while loading your documents. Please try again.',
      buttonText: actionText || 'Try Again',
      buttonIcon: <ReloadOutlined />
    },
    'loading': {
      icon: <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>,
      description: description || 'Loading your documents...',
      buttonText: undefined,
      buttonIcon: undefined
    }
  };

  const config = configs[type] || configs['no-documents'];

  return (
    <div className={`empty-state flex items-center justify-center py-12 ${className || ''}`}>
      <Empty
        image={config.icon}
        description={
          <div className="text-gray-500 text-center max-w-md">
            <p className="text-base">{config.description}</p>
          </div>
        }
        imageStyle={{
          height: 120,
          marginBottom: 24
        }}
      >
        {onAction && config.buttonText && (
          <Button
            type="primary"
            icon={config.buttonIcon}
            onClick={onAction}
            size="large"
            className="mt-4"
          >
            {config.buttonText}
          </Button>
        )}
      </Empty>
    </div>
  );
}

export default EmptyState;