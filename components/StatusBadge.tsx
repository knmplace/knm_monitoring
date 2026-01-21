/**
 * Status Badge Component
 * Color-coded status indicators for services and processes
 */

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'stopped' | 'errored' | 'active' | 'inactive' | 'partial';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    online: {
      color: 'bg-green-100 text-green-800 border-green-300',
      dot: 'bg-green-600',
      label: 'Online',
    },
    active: {
      color: 'bg-green-100 text-green-800 border-green-300',
      dot: 'bg-green-600',
      label: 'Active',
    },
    offline: {
      color: 'bg-red-100 text-red-800 border-red-300',
      dot: 'bg-red-600',
      label: 'Offline',
    },
    stopped: {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      dot: 'bg-gray-600',
      label: 'Stopped',
    },
    inactive: {
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      dot: 'bg-gray-600',
      label: 'Inactive',
    },
    errored: {
      color: 'bg-red-100 text-red-800 border-red-300',
      dot: 'bg-red-600',
      label: 'Error',
    },
    partial: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      dot: 'bg-yellow-600',
      label: 'Partial',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
