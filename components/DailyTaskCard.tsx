'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Paragraph } from '@/components/Paragraph';
import { 
  Lock, 
  Circle, 
  CheckCircle2, 
  Plus,
  ExternalLink,
  Calendar
} from 'lucide-react';

interface DailyTask {
  _id: string;
  dayNumber: number;
  description: string;
  resources: Array<{ url: string; title?: string }>;
  status: 'locked' | 'active' | 'complete';
  completionData?: {
    code: string;
    learningNotes: string;
    completedAt: string;
  };
  createdAt: string;
}

interface DailyTaskCardProps {
  task?: DailyTask;
  dayNumber: number;
  onAddTask?: () => void;
  onComplete?: () => void;
  onGenerateContent?: () => void;
}

export default function DailyTaskCard({
  task,
  dayNumber,
  onAddTask,
  onComplete,
  onGenerateContent,
}: DailyTaskCardProps) {
  // Task doesn't exist yet
  if (!task) {
    return (
      <Card className="p-6 border-dashed bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gray-200">
              <Circle className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <Paragraph className="font-semibold text-gray-900">
                Day {dayNumber}
              </Paragraph>
              <Paragraph variant="small" className="text-gray-500">
                Not created yet
              </Paragraph>
            </div>
          </div>
          {onAddTask && (
            <Button onClick={onAddTask} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const statusConfig = {
    locked: {
      icon: Lock,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      badge: 'Locked',
      badgeClass: 'bg-gray-100 text-gray-600',
    },
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

  return (
    <Card className={`p-6 border-2 ${config.borderColor} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Paragraph className="font-semibold text-gray-900">
                Day {task.dayNumber}
              </Paragraph>
              <Badge variant="outline" className={config.badgeClass}>
                {config.badge}
              </Badge>
            </div>
            <Paragraph className="text-gray-700">
              {task.description}
            </Paragraph>
          </div>
        </div>
      </div>

      {/* Resources */}
      {task.resources && task.resources.length > 0 && (
        <div className="mb-4">
          <Paragraph variant="small" className="text-gray-500 mb-2">
            Resources ({task.resources.length})
          </Paragraph>
          <div className="space-y-1">
            {task.resources.map((resource, idx) => (
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
          </div>
        </div>
      )}

      {/* Locked Message */}
      {task.status === 'locked' && (
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
          <Paragraph variant="small" className="text-gray-600">
            🔒 Complete Day {task.dayNumber - 1} to unlock this task
          </Paragraph>
        </div>
      )}

      {/* Active Actions */}
      {task.status === 'active' && onComplete && (
        <div className="pt-4 border-t">
          <Button onClick={onComplete} className="w-full gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Mark Complete
          </Button>
        </div>
      )}

      {/* Complete Actions */}
      {task.status === 'complete' && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2 text-green-600">
            <Calendar className="h-4 w-4" />
            <Paragraph variant="small">
              Completed {new Date(task.completionData!.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Paragraph>
          </div>
          {onGenerateContent && (
            <Button onClick={onGenerateContent} variant="outline" className="w-full gap-2">
              ✨ Generate Content
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
