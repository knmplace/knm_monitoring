'use client';

/**
 * Log Modal Component
 * Displays logs in a modal window with copy and refresh functionality
 */

import { useEffect, useState } from 'react';
import { X, RefreshCw, Copy, Loader2 } from 'lucide-react';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  logs: string;
  loading?: boolean;
  onRefresh?: () => void;
}

export function LogModal({ isOpen, onClose, title, logs, loading = false, onRefresh }: LogModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
                  title="Refresh logs"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-100 rounded-md flex items-center gap-2"
                title="Copy all logs"
              >
                <Copy className="h-5 w-5" />
                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-md"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : logs ? (
              <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto font-mono">
                {logs}
              </pre>
            ) : (
              <div className="text-center text-gray-500">
                No logs available
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
