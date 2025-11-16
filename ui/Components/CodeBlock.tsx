import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from './CopyButton';


// Type assertion to handle React component compatibility
const Highlighter = SyntaxHighlighter as unknown as React.ComponentType<any>;

interface ICodeBlock {
  language: string;
  themeMode: 'dark' | 'light';
  children: string;
  className?: string;
}

function CodeBlock({ language, themeMode, children, className }: ICodeBlock) {
  return (
    <div
      className={`
      ${className || ''}
      my-4 rounded-lg overflow-hidden text-sm leading-6
      border border-border
      `}
    >
      {/* Header bar */}
      <div className={`
      flex justify-between items-center px-4 py-2 bg-muted border-b border-border
      `}>
        <span className={`
        text-xs font-semibold uppercase text-foreground opacity-90
      `}>
          {language || 'plaintext'}
        </span>
        <CopyButton text={children} />
      </div>

      {/* Code content */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <Highlighter
          style={themeMode === 'dark' ? vscDarkPlus : vs}
          language={language}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.5rem 0.5rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            background: 'none',
          }}
          PreTag="pre"
        >
          {children}
        </Highlighter>
      </div>
    </div>
  );
}

export default CodeBlock;