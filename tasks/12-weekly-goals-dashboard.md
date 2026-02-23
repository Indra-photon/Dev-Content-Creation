# Task 12: Weekly Goals Dashboard

**Phase:** 2 - Frontend  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 11 (Example Posts UI) ✅, Task 03 (Weekly Goals API) ✅

---

## Objective

Build the weekly goals dashboard with list view, create modal, progress tracking, and status indicators. Show active/complete weeks with task progress and enforce the sequential week creation rule.

---

## Prerequisites

- ✅ Weekly Goals API working (Task 03)
- ✅ Layout and navigation ready (Task 10)
- ✅ Example Posts UI complete (Task 11)
- ✅ shadcn/ui components installed

---

## Install Additional shadcn Components

```bash
npx shadcn-ui@latest add input
npx shadcn-ui@latest add radio-group
```

---

## Create Weekly Goal Card Component

**File:** `components/WeeklyGoalCard.tsx`

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Calendar, Target, CheckCircle2, Circle, Lock } from 'lucide-react';
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
```

---

## Create New Weekly Goal Modal

**File:** `components/NewWeeklyGoalModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useRouter } from 'next/navigation';
import { Sparkles, Target } from 'lucide-react';

interface NewWeeklyGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewWeeklyGoalModal({ 
  open, 
  onOpenChange 
}: NewWeeklyGoalModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'learning' | 'product'>('learning');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title for your weekly goal');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/weekly-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for active goal error
        if (data.activeGoal) {
          toast.error(
            `Complete your active week first: "${data.activeGoal.title}" (${data.activeGoal.completedTasks}/7 tasks done)`,
            { duration: 5000 }
          );
        } else {
          toast.error(data.error || 'Failed to create weekly goal');
        }
        return;
      }

      toast.success('Weekly goal created!');
      onOpenChange(false);
      setTitle('');
      setType('learning');
      
      // Navigate to the new goal
      router.push(`/dashboard/goals/${data.data._id}`);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <Heading as="h2" className="text-gray-900 text-2xl">
              Create Weekly Goal
            </Heading>
          </DialogTitle>
          <DialogDescription>
            <Paragraph variant="muted">
              Set a focused goal for the next 7 days. You'll complete one task per day.
            </Paragraph>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Master React Hooks"
              className="text-base"
            />
            <Paragraph variant="small" className="text-gray-500">
              What do you want to accomplish this week?
            </Paragraph>
          </div>

          {/* Type */}
          <div className="space-y-3">
            <Label>Goal Type</Label>
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
                        Educational content, tutorials, skill development
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
                        Features, launches, development updates
                      </Paragraph>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
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
            {isSubmitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Update Goals Page with Full Functionality

**File:** `app/dashboard/goals/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target } from 'lucide-react';
import WeeklyGoalCard from '@/components/WeeklyGoalCard';
import NewWeeklyGoalModal from '@/components/NewWeeklyGoalModal';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

interface WeeklyGoal {
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
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/weekly-goals');
      const data = await response.json();

      if (response.ok) {
        setGoals(data.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load weekly goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleModalClose = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) {
      fetchGoals(); // Refresh goals when modal closes
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completeGoals = goals.filter(g => g.status === 'complete');

  const filteredGoals = 
    activeTab === 'active' ? activeGoals :
    activeTab === 'complete' ? completeGoals :
    goals;

  if (isLoading) {
    return <GoalsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h1" className="text-gray-900">
            Weekly Goals
          </Heading>
          <Paragraph variant="muted" className="mt-2">
            Track your learning journey, one week at a time
          </Paragraph>
        </div>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
          New Week
        </Button>
      </div>

      {/* Stats Cards */}
      {goals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <Paragraph variant="small" className="text-gray-500">
                  Total Weeks
                </Paragraph>
                <Heading as="h3" className="text-gray-900 text-2xl">
                  {goals.length}
                </Heading>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <Paragraph variant="small" className="text-gray-500">
                  Active
                </Paragraph>
                <Heading as="h3" className="text-gray-900 text-2xl">
                  {activeGoals.length}
                </Heading>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-violet-100">
                <Target className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <Paragraph variant="small" className="text-gray-500">
                  Completed
                </Paragraph>
                <Heading as="h3" className="text-gray-900 text-2xl">
                  {completeGoals.length}
                </Heading>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {goals.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All ({goals.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="complete">Complete ({completeGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredGoals.length > 0 ? (
              <div className="grid gap-4">
                {filteredGoals.map((goal) => (
                  <WeeklyGoalCard key={goal._id} goal={goal} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-dashed">
                <Paragraph variant="muted">
                  No {activeTab} goals yet
                </Paragraph>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          icon={Target}
          title="No weekly goals yet"
          description="Create your first weekly goal to start your focused learning journey. You'll complete 7 daily tasks, one week at a time."
          action={{
            label: 'Create First Goal',
            onClick: () => setShowCreateModal(true),
          }}
        />
      )}

      {/* Create Modal */}
      <NewWeeklyGoalModal
        open={showCreateModal}
        onOpenChange={handleModalClose}
      />
    </div>
  );
}

function GoalsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Create First Goal
- [ ] Click "New Week" button
- [ ] Enter title "Master React Hooks"
- [ ] Select "Learning" type
- [ ] Submit form
- [ ] Should redirect to goal detail page
- [ ] Verify goal appears in list

### Try to Create Second Goal (Should Block)
- [ ] Click "New Week" again
- [ ] Try to create another goal
- [ ] Should see error toast about completing active week first
- [ ] Error should show current progress (0/7 tasks)

### View Goals List
- [ ] See stats cards (Total, Active, Completed)
- [ ] Switch between tabs (All, Active, Complete)
- [ ] Click on a goal card
- [ ] Should navigate to detail page

### Progress Tracking
- [ ] Verify progress bar shows 0/7
- [ ] Badge shows "Active" status
- [ ] Date shows correctly formatted

### Empty State
- [ ] Delete all goals (via API)
- [ ] See empty state
- [ ] Click "Create First Goal"
- [ ] Modal should open

### Responsive Design
- [ ] Test on mobile - cards stack vertically
- [ ] Test on tablet - 2 columns
- [ ] Test on desktop - full layout
- [ ] Stats cards responsive

---

## Features Implemented

✅ **Weekly Goal Cards** - With type, status, progress, and dates  
✅ **Create Modal** - Radio group for type selection  
✅ **Sequential Enforcement** - Error if active week exists  
✅ **Stats Overview** - Total, Active, Complete counts  
✅ **Tabs Filtering** - Filter by All/Active/Complete  
✅ **Progress Tracking** - Visual progress bar  
✅ **Empty State** - With CTA button  
✅ **Loading States** - Skeleton loaders  
✅ **Navigation** - Click card to view details  
✅ **Toast Notifications** - Success/error feedback  

---

## Next Steps

After completing this task:
1. Move to Task 13: Create Weekly Goal Flow (detail page)
2. That will handle adding daily tasks to the week
3. Then implement the lock system visualization

---

## Git Commit

```bash
# Stage the files
git add components/WeeklyGoalCard.tsx
git add components/NewWeeklyGoalModal.tsx
git add app/dashboard/goals/page.tsx
git add components/ui/*  # New shadcn components

# Commit
git commit -m "feat: add Weekly Goals dashboard

- Create WeeklyGoalCard with progress tracking
- Add NewWeeklyGoalModal with type selection
- Implement goals list with tabs filtering
- Add stats overview cards (Total/Active/Complete)
- Enforce sequential week creation (show error)
- Add empty state with CTA
- Implement responsive grid layout
- Add progress bars and status badges
- Use existing Heading/Paragraph components
- Integrate with Weekly Goals API
- Add navigation to goal detail page
- Include loading skeletons"

git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `11-example-posts-ui.md` ✅  
**Next Task:** `13-create-weekly-goal.md`