import React, { useState } from 'react';
import { Button, Card, Tag, List, Typography, Space, Divider, message } from 'antd';
import {
  FileOutlined,
  FolderOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import ElectronDragDrop from '@ui/Components/ElectronDragDrop';

const { Title, Text, Paragraph } = Typography;

interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  extension?: string;
}

interface AddedItem {
  id: string;
  type: 'file' | 'directory';
  info: FileInfo;
}

function AddFile() {
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file/folder drop using the unified file:add-path handler
  const handlePathAdded = async (kind: 'file' | 'directory', fullPath: string) => {
    try {
      // Get the file info using the unified handler
      const result = await window.electron['file:add-path'](fullPath);

      if (result.success && result.path) {
        const newItem: AddedItem = {
          id: Date.now().toString() + Math.random(),
          type: result.kind,
          info: {
            path: result.path,
            name: result.name || '',
            size: result.size || 0,
            isDirectory: result.kind === 'directory',
            extension: result.extension,
          },
        };
        setAddedItems((prev) => [...prev, newItem]);
      } else {
        message.error(result.error || 'Failed to add path');
      }
    } catch (error) {
      console.error('Error processing path:', error);
      message.error(`Error processing: ${fullPath}`);
    }
  };

  // Remove item from list
  const handleRemove = (id: string) => {
    setAddedItems((prev) => prev.filter((item) => item.id !== id));
    message.info('Item removed');
  };

  // Clear all items
  const handleClearAll = () => {
    setAddedItems([]);
    message.info('All items cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Title level={2}>
            <CloudUploadOutlined className="mr-3" />
            Drag & Drop File Handler
          </Title>
          <Paragraph type="secondary">
            Drag and drop files or folders to process them with the unified file:add-path handler. This demonstrates file path capture in Electron.
          </Paragraph>
        </div>

        {/* Drag and Drop Zone */}
        <ElectronDragDrop
          onAdded={handlePathAdded}
          className="mb-6"
        />

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <Space direction="vertical" size="small">
            <Space>
              <InfoCircleOutlined className="text-blue-500" />
              <Text strong>How it works:</Text>
            </Space>
            <ul className="ml-6 space-y-1">
              <li>
                <Text type="secondary">• Drag files or folders to call unified <code>file:add-path</code> IPC method</Text>
              </li>
              <li>
                <Text type="secondary">• File paths are captured (not file contents)</Text>
              </li>
              <li>
                <Text type="secondary">• Supports both individual files and directories</Text>
              </li>
              <li>
                <Text type="secondary">• Automatically detects file vs folder types</Text>
              </li>
            </ul>
            <Divider className="my-2" />
            <Space>
              <InfoCircleOutlined className="text-orange-500" />
              <Text strong type="warning">Important:</Text>
            </Space>
            <Text type="secondary" className="block">
              This feature requires running the app through Electron (<code>yarn dev</code>), not just the browser.
              If you see "Unable to get file path", make sure you're not accessing via localhost in a regular browser.
            </Text>
          </Space>
        </Card>

        {/* Added Items List */}
        {addedItems.length > 0 && (
          <Card
            title={
              <Space>
                <Text strong>Added Items ({addedItems.length})</Text>
              </Space>
            }
            extra={
              <Button danger size="small" icon={<DeleteOutlined />} onClick={handleClearAll}>
                Clear All
              </Button>
            }
          >
            <List
              dataSource={addedItems}
              renderItem={(item) => (
                <Card
                  key={item.id}
                  className="mb-4"
                  size="small"
                  extra={
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(item.id)}
                    >
                      Remove
                    </Button>
                  }
                >
                  <Space direction="vertical" className="w-full">
                    {/* Item Header */}
                    <Space>
                      {item.type === 'directory' ? (
                        <FolderOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                      ) : (
                        <FileOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                      )}
                      <div>
                        <Text strong className="text-base">
                          {item.info.name}
                        </Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                          {item.info.path}
                        </Text>
                      </div>
                    </Space>

                    {/* Item Details */}
                    <Space split={<Divider type="vertical" />}>
                      <Tag color={item.type === 'directory' ? 'gold' : 'blue'}>
                        {item.type === 'directory' ? 'Directory' : 'File'}
                      </Tag>
                      {item.info.extension && <Tag>{item.info.extension}</Tag>}
                      <Text type="secondary">{formatFileSize(item.info.size)}</Text>
                    </Space>
                  </Space>
                </Card>
              )}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export default AddFile;
