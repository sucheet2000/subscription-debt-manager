import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary Component
 * Catches React component errors and displays fallback UI
 * Prevents entire app from crashing due to single component error
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Update state with error info
    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
          <div className="w-full max-w-md">
            {/* Error Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-900/30">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
                Oops! Something went wrong
              </h1>

              {/* Error Description */}
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                We encountered an unexpected error. Don't worry, our team has been notified.
                You can try reloading the page or reset the application.
              </p>

              {/* Error Details (Dev Only) */}
              {isDevelopment && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
                  <p className="font-mono text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </p>

                  {this.state.errorInfo && (
                    <details className="mt-3 text-xs text-red-600 dark:text-red-400">
                      <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                      <pre className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Error Count */}
              {this.state.errorCount > 1 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-4">
                  This error has occurred {this.state.errorCount} times.
                  Please reload if it persists.
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {/* Support Info */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                If the problem persists, please clear your browser cache and try again.
              </p>
            </div>

            {/* Footer Message */}
            <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-6">
              Error ID: {new Date().getTime()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
