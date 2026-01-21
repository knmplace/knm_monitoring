/**
 * Project Card Component
 * Displays project overview on the main dashboard
 */

import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { ChevronRight, Activity } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: 'online' | 'offline' | 'partial';
    processes: {
      online: number;
      total: number;
    };
    services: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            <span>
              {project.processes.online}/{project.processes.total} processes
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{project.services} services</span>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>
    </Link>
  );
}
