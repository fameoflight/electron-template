import React, { useState, useCallback, forwardRef } from "react";
import { copyToClipboard } from './utils';
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';

interface ICopyButtonProps {
  text: string;
  className?: string;
}

const CopyButton = React.memo(forwardRef<HTMLButtonElement, ICopyButtonProps>(function CopyButton(props, ref) {
  const [isCopied, setIsCopied] = useState(false);
  const { text, className, ...restProps } = props;

  // ✅ Memoize the onClick handler
  const handleCopy = useCallback(() => {
    copyToClipboard(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }, [text]); // Only re-create if `text` changes

  // ✅ Optional: Memoize className to prevent re-computation
  const buttonClass = React.useMemo(() => {
    return `
      flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors
      ${className ? className : ''}
      ${isCopied
        ? 'bg-green-600 text-white border-green-600 opacity-90 cursor-not-allowed'
        : 'bg-transparent text-gray-300 hover:bg-gray-800 border-gray-700'}
    `;
  }, [isCopied, className]);

  return (
    <button
      ref={ref}
      onClick={handleCopy}
      disabled={isCopied}
      className={buttonClass}
    >
      {isCopied ? <CheckOutlined /> : <CopyOutlined />}
      {isCopied ? 'Copied!' : 'Copy'}
    </button>
  );
}));

export default CopyButton;