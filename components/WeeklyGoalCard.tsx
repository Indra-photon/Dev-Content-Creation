'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Calendar, Target, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

interface WeeklyGoalCardProps {
  goal: {
    _id: string;
    title: string;
    type: 'learning' | 'product';
    status: 'active' | 'complete';
    startDate: string;
    completedAt?: string;
    taskStats?: {
      total: number;
      completed: number;
      progress: number;
    };
  };
}

export default function WeeklyGoalCard({ goal }: WeeklyGoalCardProps) {
  const isComplete = goal.status === 'complete';
  const progress = goal.taskStats?.progress || 0;
  const completedTasks = goal.taskStats?.completed || 0;
  const totalTasks = goal.taskStats?.total || 7;

  const typeColors = {
    learning: 'bg-blue-100 text-blue-700 border-blue-200',
    product: 'bg-violet-100 text-violet-700 border-violet-200',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700 border-green-200',
    complete: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <Link href={`/dashboard/goals/${goal._id}`}>
      <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={typeColors[goal.type]}>
                {goal.type === 'learning' ? '📚 Learning' : '🚀 Product'}
              </Badge>
              <Badge variant="outline" className={statusColors[goal.status]}>
                {isComplete ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    <Circle className="h-3 w-3 mr-1" />
                    Active
                  </>
                )}
              </Badge>
            </div>
            <Heading as="h3" className="text-gray-900 text-xl group-hover:text-blue-600 transition-colors">
              {goal.title}
            </Heading>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <Paragraph variant="small" className="text-gray-600">
              Progress
            </Paragraph>
            <Paragraph variant="small" className="text-gray-900 font-semibold">
              {completedTasks}/{totalTasks} tasks
            </Paragraph>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <Paragraph variant="small">
              {new Date(goal.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Paragraph>
          </div>

          {isComplete && goal.completedAt && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <Paragraph variant="small">
                Completed {new Date(goal.completedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Paragraph>
            </div>
          )}

          {!isComplete && (
            <Button variant="ghost" size="sm" className="gap-2">
              <Target className="h-4 w-4" />
              Continue
            </Button>
          )}
        </div>
      </Card>
    </Link>
  );
}
