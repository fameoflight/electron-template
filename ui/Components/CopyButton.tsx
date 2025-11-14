import React, { useState, useCallback, forwardRef } from "react";
import { copyToClipboard } from './utils';
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';

interface ICopyButtonProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

const CopyButton = React.memo(forwardRef<HTMLButtonElement, ICopyButtonProps>(function CopyButton(props, ref) {
  const [isCopied, setIsCopied] = useState(false);

  // ✅ Memoize the onClick handler
  const handleCopy = useCallback(() => {
    copyToClipboard(props.text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }, [props.text]); // Only re-create if `text` changes

  // ✅ Optional: Memoize className to prevent re-computation
  const buttonClass = React.useMemo(() => {
    return `
      flex items-center gap-1 px-2 py-1 rounded text-xs
      border transition-colors duration-200
      text-foreground border-border hover:bg-muted
      ${isCopied ? 'opacity-50 cursor-not-allowed' : ''}
    `;
  }, [isCopied]);

  return (
    <button
      ref={ref}
      style={props.style}
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