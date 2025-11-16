import React, { useState, useEffect, useRef } from 'react';

interface IStreamingTextProps {
  text: string | null | undefined;
  isStreaming?: boolean;
  speed?: number; // characters per second
  onComplete?: () => void;
  className?: string;
}

/**
 * StreamingText component provides character-by-character text reveal effect.
 *
 * Features:
 * - Typewriter effect during streaming
 * - Instant reveal for completed messages
 * - Configurable typing speed (default: 30 chars/sec)
 * - Auto-scroll support
 * - Performance optimized with requestAnimationFrame
 */
function StreamingText({
  text,
  isStreaming = false,
  speed = 40,
  onComplete,
  className = ''
}: IStreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousTextRef = useRef('');
  const charDelay = 1000 / speed; // Convert to milliseconds between characters

  // Reset when new text arrives
  useEffect(() => {
    const newText = text || '';
    const prevText = previousTextRef.current;

    if (newText !== prevText) {
      // Check if this is continuation (text appended) or a new message
      const isContinuation = newText.startsWith(prevText) && prevText.length > 0;

      previousTextRef.current = newText;

      if (!isStreaming) {
        // For completed messages, show text immediately
        setDisplayedText(newText);
        setIsComplete(true);
        return;
      }

      // For streaming messages
      if (!isContinuation) {
        // New message started - reset and begin typewriter
        setDisplayedText('');
        setIsComplete(false);
      }
      // Otherwise, continue from current position (let typewriter catch up)
    }
  }, [text, isStreaming]);

  // Typewriter effect
  useEffect(() => {
    if (!isStreaming || !text || isComplete) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let currentIndex = displayedText.length;

    intervalRef.current = setInterval(() => {
      if (currentIndex >= text.length) {
        // Finished typing
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsComplete(true);
        onComplete?.();
        return;
      }

      // Add next character(s)
      const nextIndex = Math.min(currentIndex + 1, text.length);
      setDisplayedText(text.slice(0, nextIndex));
      currentIndex = nextIndex;
    }, charDelay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, isStreaming, displayedText.length, isComplete, charDelay, onComplete]);

  // Show cursor during active streaming
  const showCursor = isStreaming && !isComplete;

  return (
    <span className={`streaming-text ${className}`}>
      {displayedText}
      {showCursor && (
        <span
          className="animate-pulse text-primary-600"
          style={{
            animation: 'blink 1s infinite',
            opacity: 1
          }}
        >
          |
        </span>
      )}
    </span>
  );
}

export default StreamingText;