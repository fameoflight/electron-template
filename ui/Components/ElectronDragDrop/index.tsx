import React, { useState, useRef } from 'react';
import { Card, Typography, Space, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { isElectron } from '@ui/Components/utils';

const { Title, Text } = Typography;

interface IElectronDragDropProps {
  onAdded?: (kind: 'file' | 'directory', fullPath: string, file: File | null) => void;
  className?: string;
  children?: React.ReactNode;
}

function ElectronDragDrop(props: IElectronDragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Type assertion for the electron API with getPathForFile
  const electronWithFilePath = window.electron as {
    'file:add-path': (path: string) => Promise<any>;
    getPathForFile?: (file: File) => string;
  };

  // Extract file path from File object
  const getFilePath = async (file: File): Promise<string | null> => {
    if (!isElectron()) {
      message.error('This feature only works in Electron environment');
      return null;
    }

    try {
      // Try the modern Electron 39+ API first
      if (electronWithFilePath.getPathForFile) {
        const filePath = electronWithFilePath.getPathForFile(file);
        console.log('✅ Got file path using webUtils.getPathForFile:', filePath);
        return filePath;
      } else {
        // Fallback to legacy File.path property (older Electron versions)
        const filePath = (file as any).path as string;
        console.log('⚠️  Using legacy File.path:', filePath);
        return filePath;
      }
    } catch (error) {
      console.error('❌ Failed to get file path:', error);
      message.error(`Unable to get file path for: ${file.name}. Make sure you're running in Electron, not a browser.`);
      return null;
    }
  };

  // Handle drag enter
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle file/folder drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (!isElectron()) {
      message.error('This feature only works in Electron environment');
      return;
    }

    const items = Array.from(e.dataTransfer.files);

    if (items.length === 0) {
      message.warning('No files or folders detected');
      return;
    }

    for (const file of items) {
      const filePath = await getFilePath(file);

      if (!filePath) {
        continue;
      }

      console.log('📂 Processing file/folder:', filePath);

      try {
        // Use the unified file:add-path handler
        const result = await electronWithFilePath['file:add-path'](filePath);

        if (result.success && result.path) {
          const kind = result.kind;

          props.onAdded?.(kind, result.path, file);

          const typeLabel = kind === 'directory' ? 'Directory' : 'File';
          message.success(`${typeLabel} added: ${result.name}`);
        } else {
          message.error(result.error || 'Failed to add path');
        }
      } catch (error) {
        console.error('Error processing drop:', error);
        message.error(`Error processing: ${file.name}`);
      }
    }
  };

  // Default content if no children provided
  const defaultContent = (
    <div className="text-center py-16">
      <CloudUploadOutlined
        style={{ fontSize: '64px' }}
        className={`${isDragging ? 'text-blue-500' : 'text-gray-400'} mb-4`}
      />
      <Title level={4} className={isDragging ? 'text-blue-500' : 'text-gray-600'}>
        {isDragging ? 'Drop files or folders here' : 'Drag & Drop Files or Folders'}
      </Title>
      <Text type="secondary" className="block">Supports both files and folders</Text>
    </div>
  );

  return (
    <Card
      className={`transition-all duration-300 ${isDragging ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-300'
        } ${props.className || ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {props.children || defaultContent}
    </Card>
  );
}

export default ElectronDragDrop;