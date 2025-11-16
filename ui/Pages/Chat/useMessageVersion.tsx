import React from 'react';

type VersionType = {
  id: string;
  modelId: string;
  updatedAt: string;
}

interface Message<T extends VersionType> {
  id: string;
  currentVersionId: string;
  versions: readonly T[];
}

export function useMessageVersion<T extends VersionType>(message: Message<T>, updateVersion: (messageId: string, versionId: string) => void): [number, T, () => void, () => void] {
  if (!message.versions || message.versions.length === 0) {
    throw new Error("Message has no versions");
  }

  const currentVersion = message.versions.find(v => v.modelId === message.currentVersionId) || message.versions[0];

  const currentIndex = message.versions.findIndex(v => v.modelId === currentVersion.modelId);

  const onPreviousVersion = () => {
    if (currentIndex > 0) {
      const previousVersion = message.versions[currentIndex - 1];
      updateVersion(message.id, previousVersion.id);
    }
  };

  const onNextVersion = () => {
    if (currentIndex < message.versions.length - 1) {
      const nextVersion = message.versions[currentIndex + 1];
      updateVersion(message.id, nextVersion.id);
    }
  };

  return [currentIndex + 1, currentVersion, onPreviousVersion, onNextVersion];
}

