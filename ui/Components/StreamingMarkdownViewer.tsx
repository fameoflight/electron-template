import React from 'react';
import MarkdownViewer from './MarkdownViewer';
import StreamingText from './StreamingText';

interface IStreamingMarkdownViewer {
  content: string | null | undefined;
  isStreaming?: boolean;
  className?: string;
  onInternalLinkClick?: (filePath: string) => void;
}

/**
 * StreamingMarkdownViewer provides character-by-character streaming for markdown content.
 *
 * Approach:
 * - During streaming: Show raw text with typewriter effect (simple and reliable)
 * - When complete: Switch to full MarkdownViewer for proper formatting
 *
 * This gives the best of both worlds:
 * 1. Visual feedback during streaming with no parsing issues
 * 2. Full markdown rendering when complete
 */
function StreamingMarkdownViewer({
  content,
  isStreaming = false,
  className = '',
  onInternalLinkClick
}: IStreamingMarkdownViewer) {

  // If streaming, show raw text with typewriter effect
  if (isStreaming && content) {
    return (
      <div className={`streaming-markdown-viewer ${className}`}>
        <StreamingText
          text={content}
          isStreaming={isStreaming}
          speed={40} // Slightly faster for better UX
          className="whitespace-pre-wrap text-text-primary"
        />
      </div>
    );
  }

  // When not streaming, use the full MarkdownViewer
  return (
    <MarkdownViewer
      content={content}
      className={className}
      onInternalLinkClick={onInternalLinkClick}
    />
  );
}

export default StreamingMarkdownViewer;