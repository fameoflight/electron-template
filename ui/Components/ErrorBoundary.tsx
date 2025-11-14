import React, { Component, ErrorInfo, ReactNode } from 'react';

import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Button } from 'antd';

import { classNames } from './utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default beautiful error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto h-16 w-16 text-red-500 mb-6">
                <ExclamationTriangleIcon className="h-full w-full" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>

              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                We're sorry, but something unexpected happened.
                The error has been logged and our team will look into it.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-8 text-left">
                  <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <summary className="cursor-pointer text-red-800 font-medium mb-2 hover:text-red-700">
                      Error Details (Development)
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div>
                        <strong className="text-red-700">Error:</strong>
                        <pre className="mt-1 text-sm text-red-600 bg-red-100 p-2 rounded overflow-x-auto">
                          {this.state.error.message}
                        </pre>
                      </div>

                      {this.state.error.stack && (
                        <div>
                          <strong className="text-red-700">Stack Trace:</strong>
                          <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-red-700">Component Stack:</strong>
                          <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="primary"
                  icon={<ArrowPathIcon className="h-4 w-4" />}
                  onClick={this.handleReload}
                  size="large"
                  className="flex items-center justify-center"
                >
                  Reload Page
                </Button>

                <Button
                  icon={<HomeIcon className="h-4 w-4" />}
                  onClick={this.handleGoHome}
                  size="large"
                  className="flex items-center justify-center"
                >
                  Go Home
                </Button>
              </div>

              {/* Additional Help */}
              <div className="mt-8 text-sm text-gray-500">
                <p>
                  If this problem persists, please contact our support team
                  <br />
                  or try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback component for inline error boundaries
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  className?: string;
}

export function ErrorFallback({
  error,
  resetError,
  className
}: ErrorFallbackProps) {
  return (
    <div className={classNames(
      "bg-red-50 border border-red-200 rounded-lg p-6 my-4",
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Something went wrong
          </h3>

          {error && (
            <p className="text-sm text-red-600 mb-3">
              {error.message}
            </p>
          )}

          {resetError && (
            <Button
              size="small"
              type="primary"
              onClick={resetError}
              icon={<ArrowPathIcon className="h-3 w-3" />}
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for function components to use error boundaries
export function useErrorHandler() {
  return (error: Error) => {
    // This would typically integrate with a logging service
    console.error('Error caught by useErrorHandler:', error);

    // You could also show a toast notification here
    // For now, we'll throw it to be caught by the nearest ErrorBoundary
    throw error;
  };
}