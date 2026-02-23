'use client';

import { useState, useEffect } from 'react';
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

const dayGuidance = {
  1: "Start with fundamentals. What's the core concept you need to understand?",
  2: "Build on Day 1. What's the next logical step?",
  3: "Time to practice. What hands-on exercise can you do?",
  4: "Go deeper. What advanced aspect should you explore?",
  5: "Apply your knowledge. What can you build with what you've learned?",
  6: "Optimize and refine. How can you improve your approach?",
  7: "Wrap it up. What final piece completes your week?",
};

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
  const [hasChanges, setHasChanges] = useState(false);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddResource = () => {
    if (resources.length >= 5) return;
    setResources([...resources, { url: '', title: '' }]);
    setHasChanges(true);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleResourceChange = (index: number, field: 'url' | 'title', value: string) => {
    const updated = [...resources];
    updated[index][field] = value;
    setResources(updated);
    setHasChanges(true);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setHasChanges(true);
  };

  const handleClose = (open: boolean) => {
    if (!open && hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    
    if (!open) {
      setDescription('');
      setResources([{ url: '', title: '' }]);
      setHasChanges(false);
    }
    
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    if (description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    // Validate URLs
    const invalidUrls = resources.filter(r => r.url && !validateUrl(r.url));
    if (invalidUrls.length > 0) {
      toast.error('Please enter valid URLs (must start with http:// or https://)');
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
      setHasChanges(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, description, resources, weeklyGoalId, dayNumber, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

        {/* Day Guidance */}
        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Paragraph variant="small" className="text-blue-700">
            💡 {dayGuidance[dayNumber as keyof typeof dayGuidance]}
          </Paragraph>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Task Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="e.g., Learn useState and useEffect hooks"
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <Paragraph variant="small" className="text-gray-500">
                What will you learn or build today?
              </Paragraph>
              <Paragraph variant="small" className={
                description.length < 10 ? 'text-red-500' : 'text-gray-500'
              }>
                {description.length} characters
              </Paragraph>
            </div>
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

            {resources.length >= 5 && (
              <Paragraph variant="small" className="text-amber-600">
                Maximum 5 resources per task
              </Paragraph>
            )}

            <div className="space-y-3">
              {resources.map((resource, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="URL (e.g., https://react.dev/...)"
                      value={resource.url}
                      onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                      className={
                        resource.url && !validateUrl(resource.url)
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }
                    />
                    {resource.url && !validateUrl(resource.url) && (
                      <Paragraph variant="small" className="text-red-500">
                        Invalid URL format
                      </Paragraph>
                    )}
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
          <div className="flex items-center justify-between w-full">
            <Paragraph variant="small" className="text-gray-500 hidden sm:block">
              Press Cmd/Ctrl + Enter to submit
            </Paragraph>
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
