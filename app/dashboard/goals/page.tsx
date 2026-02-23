'use client';

import { useEffect, useState } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calendar } from 'lucide-react';
import TaskListCard from '@/components/TaskListCard';
import AddTaskModal from '@/components/AddTaskModal';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

interface DailyTask {
  _id: string;
  dayNumber: number;
  description: string;
  resources: Array<{ url: string; title?: string }>;
  status: 'active' | 'complete';
  scheduledDate: string;
  goalType: 'learning' | 'product';
  completionData?: {
    code: string;
    learningNotes: string;
    completedAt: string;
  };
  createdAt: string;
}

export default function GoalsPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/daily-tasks/all');
      const data = await response.json();

      if (response.ok) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskAdded = () => {
    setShowAddModal(false);
    fetchTasks();
  };

  if (isLoading) {
    return <TasksPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h1" className="text-gray-900">
            Daily Tasks
          </Heading>
          <Paragraph variant="muted" className="mt-2">
            Build consistency, one task at a time
          </Paragraph>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Daily Task
        </Button>
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <TaskListCard
              key={task._id}
              task={task}
              onComplete={() => fetchTasks()}
              onDelete={() => fetchTasks()}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No tasks yet"
          description="Create your first daily task to start building consistency. Complete each task before creating the next one."
          action={{
            label: 'Create First Task',
            onClick: () => setShowAddModal(true),
          }}
        />
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleTaskAdded}
      />
    </div>
  );
}

function TasksPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
