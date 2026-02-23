# Task 13: Weekly Goal Detail & Daily Tasks View

**Phase:** 2 - Frontend  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 12 (Weekly Goals Dashboard) ✅, Task 04 (Daily Tasks API) ✅

---

## Objective

Build the weekly goal detail page showing all 7 daily tasks with lock system visualization. Users can add tasks sequentially and see locked/active/complete states clearly.

---

## Prerequisites

- ✅ Weekly Goals Dashboard complete (Task 12)
- ✅ Daily Tasks API working (Task 04)
- ✅ shadcn/ui components installed

---

## Create Daily Task Card Component

**File:** `components/DailyTaskCard.tsx`

```tsx
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
```

---

## Create Add Daily Task Modal

**File:** `components/AddDailyTaskModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';

interface AddDailyTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeklyGoalId: string;
  dayNumber: number;
  onSuccess: () => void;
}

export default function AddDailyTaskModal({
  open,
  onOpenChange,
  weeklyGoalId,
  dayNumber,
  onSuccess,
}: AddDailyTaskModalProps) {
  const [description, setDescription] = useState('');
  const [resources, setResources] = useState<Array<{ url: string; title?: string }>>([
    { url: '', title: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddResource = () => {
    setResources([...resources, { url: '', title: '' }]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleResourceChange = (index: number, field: 'url' | 'title', value: string) => {
    const updated = [...resources];
    updated[index][field] = value;
    setResources(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    // Filter out empty resources
    const validResources = resources.filter(r => r.url.trim());

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weeklyGoalId,
          description,
          resources: validResources,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create task');
        return;
      }

      toast.success(`Day ${dayNumber} task created!`);
      setDescription('');
      setResources([{ url: '', title: '' }]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Heading as="h2" className="text-gray-900 text-2xl">
              Add Day {dayNumber} Task
            </Heading>
          </DialogTitle>
          <DialogDescription>
            <Paragraph variant="muted">
              Define what you'll work on today. Add resources to guide your learning.
            </Paragraph>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Task Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Learn useState and useEffect hooks"
              rows={3}
              className="resize-none"
            />
            <Paragraph variant="small" className="text-gray-500">
              What will you learn or build today?
            </Paragraph>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Resources (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddResource}
                className="gap-2"
              >
                <Plus className="h-3 w-3" />
                Add Resource
              </Button>
            </div>

            <div className="space-y-3">
              {resources.map((resource, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="URL (e.g., https://react.dev/...)"
                      value={resource.url}
                      onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                    />
                    <Input
                      placeholder="Title (optional)"
                      value={resource.title || ''}
                      onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                    />
                  </div>
                  {resources.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveResource(index)}
                      className="mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Create Weekly Goal Detail Page

**File:** `app/dashboard/goals/[id]/page.tsx`

```tsx
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
    learning: 'bg-blue-100 text-blue-700 border-blue-200',
    product: 'bg-violet-100 text-violet-700 border-violet-200',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    complete: 'bg-gray-100 text-gray-700',
  };

  // Create array of all 7 days
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const dayNumber = i + 1;
    const task = goal.dailyTasks.find(t => t.dayNumber === dayNumber);
    return { dayNumber, task };
  });

  return (
    <div className="space-y-6">
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
            <Heading as="h1" className="text-gray-900 mb-2">
              {goal.title}
            </Heading>
            <div className="flex items-center gap-4 text-gray-500">
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
            <Paragraph variant="small" className="text-gray-600">
              Overall Progress
            </Paragraph>
            <Paragraph variant="small" className="font-semibold text-gray-900">
              {goal.taskStats.completed}/{goal.taskStats.total} tasks completed
            </Paragraph>
          </div>
          <Progress value={goal.taskStats.progress} className="h-3" />
          <div className="flex gap-4 text-xs text-gray-500">
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
        <Heading as="h2" className="text-gray-900 text-2xl mb-4">
          Daily Tasks
        </Heading>
        <div className="grid gap-4">
          {allDays.map(({ dayNumber, task }) => (
            <DailyTaskCard
              key={dayNumber}
              task={task}
              dayNumber={dayNumber}
              onAddTask={task ? undefined : () => handleAddTask(dayNumber)}
              onComplete={task?.status === 'active' ? () => handleComplete(task._id) : undefined}
              onGenerateContent={
                task?.status === 'complete' ? () => handleGenerateContent(task._id) : undefined
              }
            />
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
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-3 w-full" />
      </Card>
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### View Goal Details
- [ ] Navigate to a weekly goal from dashboard
- [ ] See goal title, type, status badges
- [ ] See start date displayed correctly
- [ ] See progress bar showing 0/7
- [ ] See all 7 day slots

### Add First Task (Day 1)
- [ ] Day 1 shows "Add Task" button
- [ ] Click "Add Task"
- [ ] Modal opens with "Day 1" in title
- [ ] Enter description
- [ ] Add 2 resources (URL + title)
- [ ] Submit form
- [ ] Task appears with "Active" badge
- [ ] Day 2 slot still shows "Not created yet"

### Try to Add Day 3 (Should Fail)
- [ ] Try to add Day 3 task
- [ ] Backend should return error (must create Day 2 first)
- [ ] See error toast

### Sequential Task Creation
- [ ] Add Day 2 task
- [ ] Day 2 shows with "Locked" badge
- [ ] Add Day 3, 4, 5, 6, 7
- [ ] All show as "Locked" except Day 1 (Active)

### Lock Visualization
- [ ] Locked tasks show lock icon
- [ ] Locked tasks show gray styling
- [ ] Message says "Complete Day X to unlock"
- [ ] Active task shows blue styling
- [ ] Active task has "Mark Complete" button

### Resources Display
- [ ] Tasks with resources show count
- [ ] Clicking resource opens in new tab
- [ ] Resources show title if provided
- [ ] Resources show URL if no title

### Complete Week Badge
- [ ] When all 7 tasks complete
- [ ] Status badge changes to "Complete"
- [ ] "Generate Weekly Wrap-up" button appears

### Responsive Design
- [ ] Test on mobile - tasks stack
- [ ] Test on tablet - proper spacing
- [ ] Test on desktop - full width
- [ ] Resources wrap on small screens

---

## Features Implemented

✅ **7-Day Grid View** - All days visible with status  
✅ **Lock Visualization** - Clear icons and colors for locked/active/complete  
✅ **Sequential Creation** - Can only add next day in sequence  
✅ **Add Task Modal** - With description and multiple resources  
✅ **Progress Tracking** - Visual progress bar and stats  
✅ **Resource Links** - Clickable external links  
✅ **Status Badges** - Type, status indicators  
✅ **Navigation** - Back to goals, navigate to completion  
✅ **Empty Slots** - Shows "Not created yet" for missing tasks  
✅ **Complete Week CTA** - Weekly wrap-up button when done  

---

## Next Steps

After completing this task:
1. Move to Task 14: Add Daily Task Flow (the creation logic is mostly done)
2. Then Task 15: Task Completion Flow (mark complete with code/notes)
3. Then implement content generation UI

---

## Git Commit

```bash
# Stage the files
git add components/DailyTaskCard.tsx
git add components/AddDailyTaskModal.tsx
git add app/dashboard/goals/[id]/page.tsx

# Commit
git commit -m "feat: add Weekly Goal detail page with daily tasks

- Create DailyTaskCard with lock/active/complete states
- Add AddDailyTaskModal for creating tasks
- Implement 7-day grid view with all slots visible
- Add lock system visualization (icons, colors)
- Show progress bar and task statistics
- Add resource links display
- Implement sequential task creation
- Add navigation to completion flow
- Show Weekly Wrap-up CTA when complete
- Use existing Heading/Paragraph components
- Integrate with Daily Tasks API
- Add responsive layout"

git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `12-weekly-goals-dashboard.md` ✅  
**Next Task:** `14-add-daily-task.md`