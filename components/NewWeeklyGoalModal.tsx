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
