'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Target, Sparkles } from 'lucide-react';
import DailyTaskCard from '@/components/DailyTaskCard';
import AddDailyTaskModal from '@/components/AddDailyTaskModal';
import { toast } from 'sonner';

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

interface WeeklyGoal {
  _id: string;
  title: string;
  type: 'learning' | 'product';
  status: 'active' | 'complete';
  startDate: string;
  completedAt?: string;
  dailyTasks: DailyTask[];
  taskStats: {
    total: number;
    completed: number;
    active: number;
    locked: number;
    progress: number;
  };
}

export default function WeeklyGoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const fetchGoal = async () => {
    try {
      const response = await fetch(`/api/weekly-goals/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setGoal(data.data);
      } else {
        toast.error('Failed to load weekly goal');
        router.push('/dashboard/goals');
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
      toast.error('Something went wrong');
      router.push('/dashboard/goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [params.id]);

  const handleAddTask = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setShowAddTaskModal(true);
  };

  const handleTaskAdded = () => {
    fetchGoal();
  };

  const handleComplete = (taskId: string) => {
    router.push(`/dashboard/goals/${params.id}/tasks/${taskId}/complete`);
  };

  const handleGenerateContent = (taskId: string) => {
    router.push(`/dashboard/goals/${params.id}/tasks/${taskId}/generate`);
  };

  if (isLoading) {
    return <GoalDetailSkeleton />;
  }

  if (!goal) {
    return null;
  }

  const typeColors = {
    learning: 'bg-stone-100 text-stone-700 border-stone-200',
    product: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  };

  const statusColors = {
    active: 'bg-stone-100 text-stone-700',
    complete: 'bg-stone-100 text-stone-700',
  };

  // Create array of all 7 days
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const dayNumber = i + 1;
    const task = goal.dailyTasks.find(t => t.dayNumber === dayNumber);
    return { dayNumber, task };
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => router.push('/dashboard/goals')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Goals
      </Button>

      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={typeColors[goal.type]}>
                {goal.type === 'learning' ? '📚 Learning' : '🚀 Product'}
              </Badge>
              <Badge className={statusColors[goal.status]}>
                {goal.status === 'complete' ? '✓ Complete' : '○ Active'}
              </Badge>
            </div>
            <Heading as="h1" className="text-stone-900 mb-2">
              {goal.title}
            </Heading>
            <div className="flex items-center gap-4 text-stone-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Paragraph variant="small">
                  Started {new Date(goal.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Paragraph>
              </div>
              {goal.completedAt && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <Paragraph variant="small">
                    Completed {new Date(goal.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Paragraph>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Paragraph variant="small" className="text-stone-600">
              Overall Progress
            </Paragraph>
            <Paragraph variant="small" className="font-semibold text-stone-900">
              {goal.taskStats.completed}/{goal.taskStats.total} tasks completed
            </Paragraph>
          </div>
          <Progress value={goal.taskStats.progress} className="h-3" />
          <div className="flex gap-4 text-xs text-stone-500">
            <span>Active: {goal.taskStats.active}</span>
            <span>Locked: {goal.taskStats.locked}</span>
            <span>Complete: {goal.taskStats.completed}</span>
          </div>
        </div>

        {/* Weekly Wrap-up Button */}
        {goal.status === 'complete' && (
          <div className="mt-4 pt-4 border-t">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => router.push(`/dashboard/goals/${goal._id}/wrapup`)}
            >
              <Sparkles className="h-4 w-4" />
              Generate Weekly Wrap-up
            </Button>
          </div>
        )}
      </Card>

      {/* Daily Tasks */}
      <div>
        <Heading as="h2" className="text-stone-900 text-2xl mb-4">
          Daily Tasks
        </Heading>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {allDays.map(({ dayNumber, task }) => (
            <div 
              key={task?._id || `day-${dayNumber}`} 
              className="min-w-[320px] snap-start"
            >
              <DailyTaskCard
                task={task}
                dayNumber={dayNumber}
                onAddTask={task ? undefined : () => handleAddTask(dayNumber)}
                onComplete={task?.status === 'active' ? () => handleComplete(task._id) : undefined}
                onGenerateContent={
                  task?.status === 'complete' ? () => handleGenerateContent(task._id) : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      <AddDailyTaskModal
        open={showAddTaskModal}
        onOpenChange={setShowAddTaskModal}
        weeklyGoalId={goal._id}
        dayNumber={selectedDay}
        onSuccess={handleTaskAdded}
      />
    </div>
  );
}

function GoalDetailSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <Skeleton className="h-10 w-32" />
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-3 w-full" />
      </Card>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} className="p-6 min-w-[320px]">
            <Skeleton className="h-6 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}
