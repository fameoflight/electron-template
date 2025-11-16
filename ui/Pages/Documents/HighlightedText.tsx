/**
 * HighlightedText component for search term highlighting
 */
import React, { useMemo } from 'react';

interface HighlightedTextProps {
  text: string;
  query?: string;
  maxLines?: number;
  className?: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query, maxLines = 3, className = "" }) => {
  const highlightedContent = useMemo(() => {
    if (!query?.trim()) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Create fresh regex for each test to avoid stateful regex issues
      const testRegex = new RegExp(`^${escapedQuery}$`, 'i');
      return testRegex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      );
    });
  }, [text, query]);

  return (
    <p className={`text-sm text-text-secondary leading-relaxed line-clamp-${maxLines} ${className}`}>
      {highlightedContent}
    </p>
  );
};

export default HighlightedText;