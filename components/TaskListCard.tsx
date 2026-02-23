'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paragraph } from '@/components/Paragraph';
import {
  Circle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Task {
  _id: string;
  description: string;
  resources: Array<{ url: string; title?: string }>;
  status: 'active' | 'complete';
  scheduledDate: string;
  goalType: 'learning' | 'product';
  completionData?: {
    completedAt: string;
  };
}

interface TaskListCardProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
}

export default function TaskListCard({ task, onComplete }: TaskListCardProps) {
  const router = useRouter();

  const statusConfig = {
    active: {
      icon: Circle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      badge: 'Active',
      badgeClass: 'bg-blue-100 text-blue-600',
    },
    complete: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      badge: 'Complete',
      badgeClass: 'bg-green-100 text-green-600',
    },
  };

  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleComplete = () => {
    router.push(`/dashboard/tasks/${task._id}/complete`);
  };

  const handleGenerateContent = () => {
    router.push(`/dashboard/tasks/${task._id}/generate`);
  };

  return (
    <Card className={`p-6 border-2 ${config.borderColor} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`p-2 rounded-full ${config.bgColor} flex-shrink-0`}>
          <StatusIcon className={`h-5 w-5 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2 gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <CalendarIcon className="h-4 w-4" />
                <Paragraph variant="default">
                  {formatDate(task.scheduledDate)}
                </Paragraph>
              </div>
              <Badge variant="outline" className={config.badgeClass}>
                {config.badge}
              </Badge>
              <Badge variant="outline" className={
                task.goalType === 'learning'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-violet-50 text-violet-700 border-violet-200'
              }>
                {task.goalType === 'learning' ? '📚 Learning' : '🚀 Product'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <Paragraph className="text-gray-900 mb-3">
            {task.description}
          </Paragraph>

          {/* Resources */}
          {task.resources && task.resources.length > 0 && (
            <div className="mb-3">
              <Paragraph variant="small" className="text-gray-500 mb-1">
                Resources ({task.resources.length})
              </Paragraph>
              <div className="space-y-1">
                {task.resources.slice(0, 2).map((resource, idx) => (
                  <a
                    key={idx}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {resource.title || resource.url}
                  </a>
                ))}
                {task.resources.length > 2 && (
                  <Paragraph variant="small" className="text-gray-500">
                    +{task.resources.length - 2} more
                  </Paragraph>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {task.status === 'active' && (
              <Button onClick={handleComplete} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Mark Complete
              </Button>
            )}

            {task.status === 'complete' && (
              <>
                {task.completionData && (
                  <Paragraph variant="small" className="text-green-600 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed {formatDate(task.completionData.completedAt)}
                  </Paragraph>
                )}
                <Button onClick={handleGenerateContent} variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Content
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
