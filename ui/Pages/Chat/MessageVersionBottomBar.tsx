import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { PencilIcon } from '@heroicons/react/24/outline';
import CopyButton from '@ui/Components/CopyButton';
import MessageRedoButton from './MessageRedoButton';

interface MessageVersionBottomBarProps {
  messageContent: string;
  versionIndex?: number;
  totalVersions?: number;
  onPreviousVersion?: () => void;
  onNextVersion?: () => void;
  onRegenerate?: (modelId: string) => void;
  onEdit?: () => void;
  isUser?: boolean;
  isStreaming?: boolean;
}

/**
 * MessageVersionBottomBar - Action bar for message versions
 *
 * Self-contained component with:
 * - Copy button (uses CopyButton component)
 * - Regenerate action (assistant messages only)
 * - Edit action (future feature)
 * - Version navigation (< 1/4 >)
 */
function MessageVersionBottomBar({
  messageContent,
  versionIndex,
  totalVersions,
  onPreviousVersion,
  onNextVersion,
  onRegenerate,
  onEdit,
  isUser = false,
  isStreaming = false,
}: MessageVersionBottomBarProps) {
  // Version navigation
  const hasMultipleVersions = totalVersions && totalVersions > 1;
  const canNavigateBack = hasMultipleVersions && versionIndex && versionIndex > 1;
  const canNavigateForward = hasMultipleVersions && versionIndex && totalVersions && versionIndex < totalVersions;

  return (
    <div className="flex items-center justify-between pt-3 mt-3">
      {/* Left: Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Copy Button */}
        <CopyButton
          text={messageContent}
          className={`mr-2 ${isUser ? 'border-blue-400 text-blue-600 hover:bg-blue-50' : 'border-green-400 text-green-600 hover:bg-green-50'}`}
        />

        {/* Regenerate Button (Assistant only, not while streaming) */}
        {!isUser &&
          <MessageRedoButton
            onClick={(modelId) => onRegenerate?.(modelId)}
            className="inline-flex"
          />
        }

        {/* Edit Button (Future feature) */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md text-text-secondary hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Edit message"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Right: Version Navigation */}
      {hasMultipleVersions && (
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviousVersion}
            disabled={!canNavigateBack}
            className={`p-1 rounded transition-colors ${canNavigateBack
              ? 'text-text-secondary hover:text-primary-600 hover:bg-primary-50'
              : 'text-text-tertiary cursor-not-allowed opacity-50'
              }`}
            title="Previous version"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <span className="px-2 text-xs font-medium text-text-secondary">
            {versionIndex}/{totalVersions}
          </span>

          <button
            onClick={onNextVersion}
            disabled={!canNavigateForward}
            className={`p-1 rounded transition-colors ${canNavigateForward
              ? 'text-text-secondary hover:text-primary-600 hover:bg-primary-50'
              : 'text-text-tertiary cursor-not-allowed opacity-50'
              }`}
            title="Next version"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageVersionBottomBar;
