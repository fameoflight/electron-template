import React from 'react';
import _ from 'lodash';
import {
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FileMarkdownOutlined,
  FileZipOutlined,
  CodeOutlined
} from '@ant-design/icons';

interface IFileThumbnailProps {
  fileType: string;
  filename: string;
  size?: 'small' | 'default' | 'large' | number;
  className?: string;
}

function FileThumbnail(props: IFileThumbnailProps) {
  const { fileType, filename, size = 'default', className } = props;

  const sizeMap = {
    small: 24,
    default: 48,
    large: 72
  };

  const fontSize = _.isNumber(size) ? size : sizeMap[size];

  const getIcon = () => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeType = fileType?.toLowerCase();

    // Check by file extension first (more reliable)
    switch (ext) {
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: fontSize, color: '#ff4d4f' }} />;
      case 'txt':
        return <FileTextOutlined style={{ fontSize: fontSize, color: '#1890ff' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ fontSize: fontSize, color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileExcelOutlined style={{ fontSize: fontSize, color: '#52c41a' }} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <FileImageOutlined style={{ fontSize: fontSize, color: '#faad14' }} />;
      case 'md':
      case 'markdown':
        return <FileMarkdownOutlined style={{ fontSize: fontSize, color: '#722ed1' }} />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <FileZipOutlined style={{ fontSize: fontSize, color: '#8c8c8c' }} />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
      case 'xml':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
        return <CodeOutlined style={{ fontSize: fontSize, color: '#fa8c16' }} />;
      default:
        // Fallback to MIME type if available
        if (mimeType) {
          if (mimeType.includes('pdf')) {
            return <FilePdfOutlined style={{ fontSize: fontSize, color: '#ff4d4f' }} />;
          }
          if (mimeType.includes('text')) {
            return <FileTextOutlined style={{ fontSize: fontSize, color: '#1890ff' }} />;
          }
          if (mimeType.includes('image')) {
            return <FileImageOutlined style={{ fontSize: fontSize, color: '#faad14' }} />;
          }
          if (mimeType.includes('zip') || mimeType.includes('compressed')) {
            return <FileZipOutlined style={{ fontSize: fontSize, color: '#8c8c8c' }} />;
          }
        }
        return <FileOutlined style={{ fontSize: fontSize, color: '#8c8c8c' }} />;
    }
  };

  return (
    <div className={`file-thumbnail flex items-center justify-center ${className || ''}`}>
      {getIcon()}
    </div>
  );
}

export default FileThumbnail;