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
