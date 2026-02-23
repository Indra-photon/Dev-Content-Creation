'use client';

import { motion } from 'motion/react';
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
    const canAdd = onAddTask !== undefined;
    
    return (
      <motion.div
        layoutId={`task-slot-${dayNumber}`}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ transformOrigin: 'center center' }}
      >
        <Card className={`p-6 ${canAdd ? 'border-dashed bg-stone-50/50 hover:bg-stone-100/50 transition-colors' : 'border-2 border-stone-200 bg-stone-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${canAdd ? 'bg-stone-200' : 'bg-stone-100'}`}>
                {canAdd ? (
                  <Circle className="h-5 w-5 text-stone-400" />
                ) : (
                  <Lock className="h-5 w-5 text-stone-400" />
                )}
              </div>
              <div>
                <Paragraph className="font-semibold text-stone-900">
                  Day {dayNumber}
                </Paragraph>
                <Paragraph variant="small" className="text-stone-500">
                  {canAdd ? 'Ready to create' : `Create Day ${dayNumber - 1} first`}
                </Paragraph>
              </div>
            </div>
            {canAdd ? (
              <Button 
                onClick={onAddTask} 
                variant="outline" 
                className="gap-2 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
                aria-label={`Add task for day ${dayNumber}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Task
              </Button>
            ) : (
              <Badge variant="outline" className="bg-stone-50 text-stone-600 border-stone-200">
                Blocked
              </Badge>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  const statusConfig = {
    locked: {
      icon: Lock,
      color: 'text-stone-400',
      bgColor: 'bg-stone-100',
      borderColor: 'border-stone-200',
      badge: 'Locked',
      badgeClass: 'bg-stone-100 text-stone-600',
    },
    active: {
      icon: Circle,
      color: 'text-neutral-700',
      bgColor: 'bg-neutral-100',
      borderColor: 'border-neutral-300',
      badge: 'Active',
      badgeClass: 'bg-neutral-100 text-neutral-700',
    },
    complete: {
      icon: CheckCircle2,
      color: 'text-stone-700',
      bgColor: 'bg-stone-100',
      borderColor: 'border-stone-300',
      badge: 'Complete',
      badgeClass: 'bg-stone-100 text-stone-700',
    },
  };

  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      layoutId={`task-card-${task._id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{ transformOrigin: 'top center' }}
    >
      <Card className={`p-6 border ${config.borderColor} transition-all hover:shadow-sm`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Paragraph className="font-semibold text-stone-900">
                  Day {task.dayNumber}
                </Paragraph>
                <Badge variant="outline" className={config.badgeClass}>
                  {config.badge}
                </Badge>
              </div>
              <Paragraph className="text-stone-700">
                {task.description}
              </Paragraph>
            </div>
          </div>
        </div>

        {/* Resources */}
        {task.resources && task.resources.length > 0 && (
          <div className="mb-4">
            <Paragraph variant="small" className="text-stone-500 mb-2">
              Resources ({task.resources.length})
            </Paragraph>
            <div className="space-y-1">
              {task.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 hover:underline"
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
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
            <Paragraph variant="small" className="text-stone-600">
              🔒 Complete Day {task.dayNumber - 1} to unlock this task
            </Paragraph>
          </div>
        )}

        {/* Active Actions */}
        {task.status === 'active' && onComplete && (
          <div className="pt-4 border-t">
            <Button 
              onClick={onComplete} 
              className="w-full gap-2 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
              aria-label={`Mark day ${dayNumber} task as complete`}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Mark Complete
            </Button>
          </div>
        )}

        {/* Complete Actions */}
        {task.status === 'complete' && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2 text-stone-600">
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
              <Button 
                onClick={onGenerateContent} 
                variant="outline" 
                className="w-full gap-2 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
                aria-label={`Generate content for day ${dayNumber} task`}
              >
                ✨ Generate Content
              </Button>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
