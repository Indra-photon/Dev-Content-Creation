'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface DailyTask {
  _id: string;
  dayNumber: number;
  description: string;
  resources: Array<{ url: string; title?: string }>;
  status: 'locked' | 'active' | 'complete';
}

interface WeeklyGoal {
  _id: string;
  title: string;
  type: 'learning' | 'product';
}

export default function TaskCompletionPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<DailyTask | null>(null);
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [code, setCode] = useState('');
  const [learningNotes, setLearningNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inputMethod, setInputMethod] = useState<'paste' | 'github'>('paste');
  const [githubUrl, setGithubUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task
        const taskResponse = await fetch(`/api/daily-tasks/${params.taskId}`);
        const taskData = await taskResponse.json();

        if (!taskResponse.ok) {
          toast.error('Task not found');
          router.push(`/dashboard/goals/${params.id}`);
          return;
        }

        // Fetch goal
        const goalResponse = await fetch(`/api/weekly-goals/${params.id}`);
        const goalData = await goalResponse.json();

        if (!goalResponse.ok) {
          toast.error('Goal not found');
          router.push('/dashboard/goals');
          return;
        }

        setTask(taskData.data);
        setGoal(goalData.data);

        // Check if task is already complete
        if (taskData.data.status === 'complete') {
          toast.info('This task is already completed');
          router.push(`/dashboard/goals/${params.id}`);
          return;
        }

        // Check if task is locked
        if (taskData.data.status === 'locked') {
          toast.error(`Complete Day ${taskData.data.dayNumber - 1} first`);
          router.push(`/dashboard/goals/${params.id}`);
          return;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Something went wrong');
        router.push(`/dashboard/goals/${params.id}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, params.taskId, router]);

  const handleSubmit = async () => {
    // Validation
    if (!code.trim()) {
      toast.error('Please add your code');
      return;
    }

    if (code.trim().length < 10) {
      toast.error('Code must be at least 10 characters');
      return;
    }

    if (!learningNotes.trim()) {
      toast.error('Please add your learning notes');
      return;
    }

    if (learningNotes.trim().length < 20) {
      toast.error('Learning notes must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/daily-tasks/${params.taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          learningNotes: learningNotes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to complete task');
        return;
      }

      // Show success message
      if (data.weekCompleted) {
        toast.success('🎉 Week completed! All 7 tasks done!', { duration: 5000 });
      } else if (data.nextTaskUnlocked) {
        toast.success(`✅ Day ${task?.dayNumber} complete! Day ${task!.dayNumber + 1} unlocked!`);
      } else {
        toast.success('Task completed!');
      }

      // Navigate back to goal page
      router.push(`/dashboard/goals/${params.id}`);
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubImport = async () => {
    if (!githubUrl.trim()) {
      toast.error('Please enter a GitHub URL');
      return;
    }

    // Basic GitHub URL validation
    if (!githubUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL');
      return;
    }

    toast.info('Paste your code from GitHub manually for now');
    // TODO: In future, implement GitHub API integration
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Paragraph variant="muted">Loading...</Paragraph>
      </div>
    );
  }

  if (!task || !goal) return null;

  const minCodeChars = 10;
  const minNotesChars = 20;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => router.push(`/dashboard/goals/${params.id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {goal.title}
      </Button>

      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <CheckCircle2 className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <Heading as="h1" className="text-gray-900 mb-2">
              Complete Day {task.dayNumber}
            </Heading>
            <Paragraph className="text-gray-700 mb-3">
              {task.description}
            </Paragraph>
            <Badge className="bg-blue-100 text-blue-700">
              {goal.type === 'learning' ? '📚 Learning' : '🚀 Product'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Guidance Card */}
      <Card className="p-4 border-blue-200 bg-blue-50/50">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <Paragraph className="font-medium text-blue-900 mb-1">
              Completion Tips
            </Paragraph>
            <Paragraph variant="small" className="text-blue-700">
              Share your code (GitHub link or paste), then write what you learned in your own words. 
              Be detailed - this will help AI generate better content later!
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Code Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Heading as="h2" className="text-gray-900 text-xl mb-2">
              Your Code
            </Heading>
            <Paragraph variant="muted">
              Share what you built or practiced today
            </Paragraph>
          </div>

          {/* Input Method Tabs */}
          <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="paste">Paste Code</TabsTrigger>
              <TabsTrigger value="github">GitHub Link</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here...

Example:
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(prev => prev + 1);
};"
                rows={12}
                className="font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <Paragraph variant="small" className="text-gray-500">
                  Minimum {minCodeChars} characters
                </Paragraph>
                <Paragraph variant="small" className={
                  code.length < minCodeChars ? 'text-red-500' : 'text-green-600'
                }>
                  {code.length} characters
                </Paragraph>
              </div>
            </TabsContent>

            <TabsContent value="github" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Repository or Gist URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="github"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="flex-1"
                  />
                  <Button onClick={handleGithubImport} variant="outline">
                    Import
                  </Button>
                </div>
                <Paragraph variant="small" className="text-gray-500">
                  Or paste the GitHub URL and copy your code manually
                </Paragraph>
              </div>

              {githubUrl && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Paragraph variant="small" className="text-amber-800">
                    After importing, you can also paste additional code below
                  </Paragraph>
                </div>
              )}

              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code from GitHub or add additional code..."
                rows={8}
                className="font-mono text-sm"
              />
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Learning Notes */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Heading as="h2" className="text-gray-900 text-xl mb-2">
              Learning Notes
            </Heading>
            <Paragraph variant="muted">
              What did you learn? Write in your own words - be specific!
            </Paragraph>
          </div>

          <div className="space-y-3">
            <Textarea
              value={learningNotes}
              onChange={(e) => setLearningNotes(e.target.value)}
              placeholder="Example:

Today I learned how useState manages state in React. The key insights:

1. useState returns an array with [currentValue, setterFunction]
2. Calling the setter triggers a re-render
3. State updates are asynchronous - you can't read the new value immediately
4. For objects, you need to spread the previous state

The biggest aha moment was understanding that React batches state updates for performance."
              rows={10}
            />
            <div className="flex justify-between items-center">
              <Paragraph variant="small" className="text-gray-500">
                Minimum {minNotesChars} characters - be detailed!
              </Paragraph>
              <Paragraph variant="small" className={
                learningNotes.length < minNotesChars ? 'text-red-500' : 'text-green-600'
              }>
                {learningNotes.length} characters
              </Paragraph>
            </div>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-lg bg-gray-50 border">
            <Paragraph variant="small" className="font-medium text-gray-900 mb-2">
              💡 Good learning notes include:
            </Paragraph>
            <ul className="space-y-1">
              <Paragraph variant="small" className="text-gray-700">
                • Key concepts you discovered
              </Paragraph>
              <Paragraph variant="small" className="text-gray-700">
                • Challenges you faced and how you solved them
              </Paragraph>
              <Paragraph variant="small" className="text-gray-700">
                • Aha moments and insights
              </Paragraph>
              <Paragraph variant="small" className="text-gray-700">
                • How this connects to what you already know
              </Paragraph>
            </ul>
          </div>
        </div>
      </Card>

      {/* Submit */}
      <Card className="p-6 sticky bottom-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <Paragraph className="font-semibold text-gray-900">
              Ready to complete Day {task.dayNumber}?
            </Paragraph>
            <Paragraph variant="small" className="text-gray-500">
              {task.dayNumber < 7 
                ? `Day ${task.dayNumber + 1} will unlock after you submit`
                : 'This is the final task - your week will complete!'}
            </Paragraph>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || code.length < minCodeChars || learningNotes.length < minNotesChars}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Complete Task'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
