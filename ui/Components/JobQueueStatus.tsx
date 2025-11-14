import React from 'react';
import { useSystemTray } from '../hooks/useSystemTray';

interface JobQueueStatusProps {
  compact?: boolean;
}

export function JobQueueStatus({ compact = false }: JobQueueStatusProps) {
  const { jobQueueStatus, isLoading } = useSystemTray();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!jobQueueStatus) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <div className="w-4 h-4 rounded-full bg-red-500"></div>
        <span className="text-sm">Job Queue Offline</span>
      </div>
    );
  }

  if (!jobQueueStatus.isRunning) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <div className="w-4 h-4 rounded-full bg-red-500"></div>
        <span className="text-sm">Job Queue Stopped</span>
        {jobQueueStatus.error && (
          <span className="text-xs text-gray-500">({jobQueueStatus.error})</span>
        )}
      </div>
    );
  }

  const hasActiveJobs = jobQueueStatus.runningJobs > 0 || jobQueueStatus.pendingJobs > 0;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${hasActiveJobs ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <span className="text-sm text-gray-600">
          {jobQueueStatus.runningJobs} running, {jobQueueStatus.pendingJobs} pending
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Job Queue Status</h3>
        <div className={`w-3 h-3 rounded-full ${hasActiveJobs ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-blue-600">{jobQueueStatus.runningJobs}</span>
          <span className="text-sm text-gray-600">Running</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-yellow-600">{jobQueueStatus.pendingJobs}</span>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-green-600">{jobQueueStatus.completedJobs}</span>
          <span className="text-sm text-gray-600">Completed</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-red-600">{jobQueueStatus.failedJobs}</span>
          <span className="text-sm text-gray-600">Failed</span>
        </div>
      </div>

      {hasActiveJobs && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            💡 Jobs continue running when the app is minimized to system tray
          </p>
        </div>
      )}
    </div>
  );
}