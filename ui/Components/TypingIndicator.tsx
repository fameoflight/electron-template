import React from 'react';
import { motion } from '@ui/Components/Motion';

interface TypingIndicatorProps {
  className?: string;
}

/**
 * TypingIndicator - Shows animated dots when assistant is thinking
 *
 * Used when waiting for the first response chunk from the assistant.
 * Creates the impression that the AI is actively processing the request.
 */
function TypingIndicator({ className = '' }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 items-start ${className}`}
    >
      {/* Assistant Avatar */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 ring-2 ring-primary-100 animate-pulse">
        <svg
          className="w-4 h-4 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Typing Animation Container */}
      <div className="bg-surface px-5 py-4 rounded-2xl rounded-bl-md border border-border-default shadow-sm">
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary-400 rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default TypingIndicator;
