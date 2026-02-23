# Task 19: Refactor to Daily Task-Focused UI

**Phase:** 2 - Frontend Refactor  
**Estimated Time:** 6-8 hours  
**Dependencies:** Tasks 10-18 (All Frontend) ✅

---

## Objective

Refactor the application to focus on daily tasks instead of weekly goals. Hide the concept of "weeks" in the background while maintaining the sequential lock system. Users see a simple list of date-based tasks.

---

## Key Changes

### Before:
- Weekly Goals are the main focus
- Users create weeks, then add tasks to weeks
- Progress tracked by week (3/7 tasks)

### After:
- Daily Tasks are the main focus
- Users just click "Add Daily Task" (weeks auto-managed)
- Progress tracked by individual task completion
- Dates shown instead of "Day 1, Day 2, Day 3"
- Weekly wrap-up hidden for now (can be added later)

---

## 1. Create New API Endpoint for All User Tasks

**File:** `app/api/daily-tasks/all/route.ts`

```tsx
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get all weekly goals for this user
    const weeklyGoals = await WeeklyGoalModel.find({
      clerk_id: userId
    }).select('_id type');

    const weeklyGoalIds = weeklyGoals.map(g => g._id);

    // Get all tasks across all weeks
    const tasks = await DailyTaskModel.find({
      weeklyGoalId: { $in: weeklyGoalIds }
    })
    .populate('weeklyGoalId', 'type title')
    .sort({ createdAt: 1 }); // Chronological order

    // Enrich with goal type
    const enrichedTasks = tasks.map(task => ({
      ...task.toObject(),
      goalType: task.weeklyGoalId?.type,
      goalTitle: task.weeklyGoalId?.title,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedTasks,
      count: enrichedTasks.length
    });

  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
```

---

## 2. Create Helper to Auto-Manage Weekly Goals

**File:** `lib/weekHelpers.ts`

```typescript
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

/**
 * Get or create the appropriate weekly goal for the next task
 * Weeks are auto-managed in the background
 */
export async function getOrCreateWeekForTask(
  userId: string,
  taskNumber: number,
  type: 'learning' | 'product'
) {
  const weekNumber = Math.ceil(taskNumber / 7);
  const dayInWeek = ((taskNumber - 1) % 7) + 1;

  // Try to find existing week
  let week = await WeeklyGoalModel.findOne({
    clerk_id: userId,
    status: 'active'
  });

  // If no active week or it's full, check if we need a new week
  if (!week || dayInWeek === 1) {
    const taskCount = await DailyTaskModel.countDocuments({
      weeklyGoalId: week?._id
    });

    // Create new week if current is full (7 tasks)
    if (!week || taskCount === 7) {
      week = await WeeklyGoalModel.create({
        clerk_id: userId,
        title: `Week ${weekNumber}`,
        type,
        status: 'active',
        startDate: new Date(),
        dailyTasks: []
      });
    }
  }

  return week;
}

/**
 * Get the next available task number for a user
 */
export async function getNextTaskNumber(userId: string): Promise<number> {
  const weeklyGoals = await WeeklyGoalModel.find({
    clerk_id: userId
  }).select('_id');

  const weeklyGoalIds = weeklyGoals.map(g => g._id);

  const taskCount = await DailyTaskModel.countDocuments({
    weeklyGoalId: { $in: weeklyGoalIds }
  });

  return taskCount + 1;
}

/**
 * Check if user can create next task (previous must be complete)
 */
export async function canCreateNextTask(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  lastTask?: any;
}> {
  const weeklyGoals = await WeeklyGoalModel.find({
    clerk_id: userId
  }).select('_id');

  const weeklyGoalIds = weeklyGoals.map(g => g._id);

  // Get the latest task
  const lastTask = await DailyTaskModel.findOne({
    weeklyGoalId: { $in: weeklyGoalIds }
  }).sort({ createdAt: -1 });

  // If no tasks, can create first one
  if (!lastTask) {
    return { canCreate: true };
  }

  // Check if last task is complete
  if (lastTask.status !== 'complete') {
    return {
      canCreate: false,
      reason: `Complete your previous task first (created ${new Date(lastTask.createdAt).toLocaleDateString()})`,
      lastTask
    };
  }

  return { canCreate: true };
}
```

---

## 3. Update Daily Tasks API for Auto-Week Creation

**File:** `app/api/daily-tasks/route.ts` (update POST method)

```tsx
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import { getOrCreateWeekForTask, getNextTaskNumber, canCreateNextTask } from '@/lib/weekHelpers';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { description, resources, type, scheduledDate } = await request.json();

    // Validate required fields
    if (!description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: description, type' },
        { status: 400 }
      );
    }

    if (!['learning', 'product'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "learning" or "product"' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user can create next task
    const canCreate = await canCreateNextTask(userId);
    if (!canCreate.canCreate) {
      return NextResponse.json(
        { 
          error: canCreate.reason,
          lastTask: canCreate.lastTask
        },
        { status: 400 }
      );
    }

    // Get next task number
    const taskNumber = await getNextTaskNumber(userId);

    // Get or create weekly goal (auto-managed)
    const weeklyGoal = await getOrCreateWeekForTask(userId, taskNumber, type);

    // Determine day number within the week
    const dayNumber = ((taskNumber - 1) % 7) + 1;

    // Determine initial status (Day 1 of any week is active, rest are locked)
    const initialStatus = dayNumber === 1 ? 'active' : 'locked';

    // Use provided date or default to today
    const taskDate = scheduledDate ? new Date(scheduledDate) : new Date();

    // Create the daily task
    const dailyTask = await DailyTaskModel.create({
      weeklyGoalId: weeklyGoal._id,
      dayNumber,
      description,
      resources: resources || [],
      status: initialStatus,
      scheduledDate: taskDate,
    });

    // Add task reference to weekly goal
    await WeeklyGoalModel.findByIdAndUpdate(
      weeklyGoal._id,
      { $push: { dailyTasks: dailyTask._id } }
    );

    return NextResponse.json({
      success: true,
      data: {
        ...dailyTask.toObject(),
        taskNumber,
        goalType: type,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Daily task creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create daily task' },
      { status: 500 }
    );
  }
}
```

---

## 4. Update Daily Task Model with Date Field

**File:** `app/api/models/DailyTaskModel.ts` (update schema)

Add `scheduledDate` field:

```typescript
const DailyTaskSchema = new Schema({
  // ... existing fields
  scheduledDate: {
    type: Date,
    default: Date.now,
  },
  // ... rest of fields
});
```

---

## 5. Refactor Goals Page to Task List

**File:** `app/dashboard/goals/page.tsx`

```tsx
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
  status: 'locked' | 'active' | 'complete';
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
```

---

## 6. Create New Task List Card Component

**File:** `components/TaskListCard.tsx`

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paragraph } from '@/components/Paragraph';
import {
  Lock,
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
  status: 'locked' | 'active' | 'complete';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleComplete = () => {
    // Navigate to completion page (we'll need to find weeklyGoalId)
    // For now, just show a toast
    router.push(`/dashboard/tasks/${task._id}/complete`);
  };

  const handleGenerateContent = () => {
    router.push(`/dashboard/tasks/${task._id}/generate`);
  };

  return (
    <Card className={`p-6 border-2 ${config.borderColor} transition-all`}>
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
              <div className="flex items-center gap-2 text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <Paragraph variant="small">
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
            {task.status === 'locked' && (
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 flex-1">
                <Paragraph variant="small" className="text-gray-600">
                  🔒 Complete previous task to unlock
                </Paragraph>
              </div>
            )}

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
```

---

## 7. Create Simplified Add Task Modal

**File:** `components/AddTaskModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Plus, X, Sparkles, Target } from 'lucide-react';

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddTaskModal({
  open,
  onOpenChange,
  onSuccess,
}: AddTaskModalProps) {
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'learning' | 'product'>('learning');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [resources, setResources] = useState<Array<{ url: string; title?: string }>>([
    { url: '', title: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddResource = () => {
    if (resources.length >= 5) {
      toast.error('Maximum 5 resources per task');
      return;
    }
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

    const validResources = resources.filter(r => r.url.trim());

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          type,
          scheduledDate,
          resources: validResources,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.lastTask) {
          toast.error(data.error, { duration: 5000 });
        } else {
          toast.error(data.error || 'Failed to create task');
        }
        return;
      }

      toast.success('Daily task created!');
      setDescription('');
      setType('learning');
      setScheduledDate(new Date().toISOString().split('T')[0]);
      setResources([{ url: '', title: '' }]);
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
              Add Daily Task
            </Heading>
          </DialogTitle>
          <DialogDescription>
            <Paragraph variant="muted">
              Create your next daily task. Remember: you must complete this before creating another.
            </Paragraph>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Type */}
          <div className="space-y-3">
            <Label>Task Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as any)}>
              <div className="grid gap-3">
                <label
                  htmlFor="learning"
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    type === 'learning'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="learning" id="learning" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Paragraph className="font-semibold text-gray-900">
                        Learning
                      </Paragraph>
                      <Paragraph variant="small" className="text-gray-600">
                        Educational content, skill development
                      </Paragraph>
                    </div>
                  </div>
                </label>

                <label
                  htmlFor="product"
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    type === 'product'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="product" id="product" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-violet-100">
                      <Target className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <Paragraph className="font-semibold text-gray-900">
                        Product Building
                      </Paragraph>
                      <Paragraph variant="small" className="text-gray-600">
                        Features, launches, development
                      </Paragraph>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Scheduled Date</Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <Paragraph variant="small" className="text-gray-500">
              Defaults to today, but you can change it
            </Paragraph>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Task Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Learn React Hooks and build a counter app"
              rows={3}
              className="resize-none"
            />
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
                disabled={resources.length >= 5}
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

## 8. Update Routes for Completion and Generation

Since we're no longer using `[id]` for weekly goals, update routes:

**Old:**
- `/dashboard/goals/[id]/tasks/[taskId]/complete`
- `/dashboard/goals/[id]/tasks/[taskId]/generate`

**New:**
- `/dashboard/tasks/[taskId]/complete`
- `/dashboard/tasks/[taskId]/generate`

Move these files:
```bash
app/dashboard/goals/[id]/tasks/[taskId]/complete/page.tsx
→ app/dashboard/tasks/[taskId]/complete/page.tsx

app/dashboard/goals/[id]/tasks/[taskId]/generate/page.tsx
→ app/dashboard/tasks/[taskId]/generate/page.tsx
```

---

## 9. Testing Checklist

### Task Creation
- [ ] Click "Add Daily Task" button
- [ ] Modal opens with today's date pre-filled
- [ ] Select task type (Learning/Product)
- [ ] Enter description
- [ ] Add resources (optional)
- [ ] Submit creates task
- [ ] Task appears in list with correct date

### Sequential Lock
- [ ] Create first task
- [ ] Try to create second task without completing first
- [ ] Should see error: "Complete your previous task first"
- [ ] Complete first task
- [ ] Now can create second task

### Task Display
- [ ] Tasks show with actual dates (not Day 1, Day 2)
- [ ] First task shows as "Active"
- [ ] Subsequent tasks show as "Locked"
- [ ] Completed tasks show completion date
- [ ] Type badges show correctly (Learning/Product)

### Navigation
- [ ] Click "Mark Complete" on active task
- [ ] Navigates to `/dashboard/tasks/[taskId]/complete`
- [ ] After completion, navigate back
- [ ] Click "Generate Content" on completed task
- [ ] Navigates to `/dashboard/tasks/[taskId]/generate`

### Week Auto-Management
- [ ] Create 7 tasks (Week 1 auto-created in background)
- [ ] Complete all 7 tasks
- [ ] Create 8th task (Week 2 auto-created)
- [ ] Check database - should have 2 weekly goals
- [ ] User never sees "weeks" in UI

---

## 10. Database Migration Note

**Important:** Existing tasks don't have `scheduledDate` field.

**Migration script** (run once):

```javascript
// scripts/migrate-add-scheduled-dates.js
import dbConnect from '../lib/dbConnect';
import DailyTaskModel from '../app/api/models/DailyTaskModel';

async function migrate() {
  await dbConnect();
  
  const tasks = await DailyTaskModel.find({ scheduledDate: { $exists: false } });
  
  for (const task of tasks) {
    task.scheduledDate = task.createdAt;
    await task.save();
  }
  
  console.log(`Migrated ${tasks.length} tasks`);
}

migrate();
```

<!-- ---

## Git Commit

```bash
# Stage all changes
git add app/api/daily-tasks/all/route.ts
git add app/api/daily-tasks/route.ts
git add app/api/models/DailyTaskModel.ts
git add app/dashboard/goals/page.tsx
git add app/dashboard/tasks/[taskId]/complete/page.tsx
git add app/dashboard/tasks/[taskId]/generate/page.tsx
git add components/TaskListCard.tsx
git add components/AddTaskModal.tsx
git add lib/weekHelpers.ts

# Commit
git commit -m "refactor: change to daily task-focused UI

- Hide weekly goals in background (auto-managed)
- Show task list with actual dates instead of Day 1/2/3
- Add 'Add Daily Task' button with simplified modal
- Auto-create/manage weekly goals behind scenes
- Enforce sequential completion (can't create next until previous done)
- Add scheduledDate field to tasks (defaults to today)
- Update routes to /dashboard/tasks/[taskId]/*
- Create helper functions for week auto-management
- Add API endpoint to fetch all user tasks
- Simplify task creation flow (no week selection)
- Maintain lock system and completion flow
- Keep content generation feature"

git push origin your-branch-name
``` -->

---

**Status:** Ready to implement  
**Previous Task:** `18-responsive-polish.md` ✅  
**Next Task:** `20-final-testing.md`