import React, { useMemo } from 'react';
import { marked } from 'marked';
import CodeBlock from './CodeBlock';

interface IMarkdownViewer {
  content: string | null | undefined;
  className?: string;
  onInternalLinkClick?: (filePath: string) => void;
}

// Types for parsed elements
type ParsedElement =
  | { type: 'codeblock'; id: number; language: string; code: string }
  | { type: 'html'; id: number; html: string };

// Parse markdown and extract code blocks
function parseMarkdownWithCodeBlocks(markdown: string): ParsedElement[] {
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }
  const tokens = marked.lexer(markdown);
  const elements: ParsedElement[] = [];
  let elementId = 0;

  tokens.forEach((token: any) => {
    if (token.type === 'code') {
      // Render code block as React component
      elements.push({
        type: 'codeblock',
        id: elementId++,
        language: token.lang || 'plaintext',
        code: token.text,
      });
    } else {
      // Render other markdown as HTML
      elements.push({
        type: 'html',
        id: elementId++,
        html: marked.parser([token]),
      });
    }
  });

  return elements;
}

function MarkdownViewer({ content, className = '', onInternalLinkClick }: IMarkdownViewer) {

  const elements = useMemo(() => parseMarkdownWithCodeBlocks(content || ''), [content]);

  // Handle link clicks for internal help navigation
  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');

    if (link && link.href) {
      const href = link.getAttribute('href');

      if (href) {
        // Handle internal help links (relative paths ending with .md)
        if (href.endsWith('.md') || href.startsWith('./') || href.startsWith('../')) {
          event.preventDefault();

          // Resolve relative path
          let resolvedPath = href;
          if (href.startsWith('./')) {
            resolvedPath = href.substring(2); // Remove './'
          } else if (href.startsWith('../')) {
            resolvedPath = href.substring(3); // Remove '../'
          }

          // Call the callback for internal navigation
          if (onInternalLinkClick) {
            onInternalLinkClick(resolvedPath);
          }
        }
        // Handle anchor links within the same page
        else if (href.startsWith('#')) {
          event.preventDefault();
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        // Handle external links - let them open normally
        else if (href.startsWith('http://') || href.startsWith('https://')) {
          // Let external links open normally (default behavior)
          return;
        }
      }
    }
  };

  return (
    <div
      className={`markdown-viewer ${className}`}
      onClick={handleLinkClick}
    >
      {elements.map((element) => {
        if (element.type === 'codeblock') {
          return (
            <CodeBlock
              key={element.id}
              language={element.language}
              themeMode='light'
            >
              {element.code}
            </CodeBlock>
          );
        } else {
          return (
            <div
              key={element.id}
              dangerouslySetInnerHTML={{ __html: element.html }}
            />
          );
        }
      })}
    </div>
  );
}

export default MarkdownViewer;
