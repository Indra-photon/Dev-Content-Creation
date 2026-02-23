'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Copy, Check, RefreshCw, Sparkles, Twitter, Linkedin, FileText, Trophy, Calendar, Code, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedContent {
  x_post: string;
  linkedin_post: string;
  blog_post: string;
}

interface WeekStats {
  totalTasks: number;
  totalCodeLines: number;
  totalNotesLength: number;
  averageNotesPerDay: number;
  startDate: string;
  completedAt: string;
  daysToComplete: number;
}

interface WeeklyGoal {
  _id: string;
  title: string;
  type: 'learning' | 'product';
  status: string;
  startDate: string;
  completedAt?: string;
}

export default function WeeklyWrapupPage() {
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('x');
  const [progress, setProgress] = useState(0);

  // Editable content states
  const [editableX, setEditableX] = useState('');
  const [editableLinkedIn, setEditableLinkedIn] = useState('');
  const [editableBlog, setEditableBlog] = useState('');

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const response = await fetch(`/api/weekly-goals/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          toast.error('Goal not found');
          router.push('/dashboard/goals');
          return;
        }

        setGoal(data.data);

        // Check if week is complete
        if (data.data.status !== 'complete') {
          toast.error('Complete all 7 days first to generate weekly wrap-up');
          router.push(`/dashboard/goals/${params.id}`);
          return;
        }

        // Auto-generate wrap-up
        await generateWrapup();
      } catch (error) {
        console.error('Error fetching goal:', error);
        toast.error('Something went wrong');
        router.push('/dashboard/goals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoal();
  }, [params.id, router]);

  const generateWrapup = async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    try {
      const response = await fetch('/api/content/weekly-wrapup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyGoalId: params.id }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok) {
        if (data.progress) {
          toast.error(`Week not complete: ${data.progress.completed}/${data.progress.total} tasks done`);
        } else {
          toast.error(data.error || 'Failed to generate wrap-up');
        }
        return;
      }

      const generated = data.data.generatedContent;
      setContent(generated);
      setStats(data.data.weekStats);
      setEditableX(generated.x_post);
      setEditableLinkedIn(generated.linkedin_post);
      setEditableBlog(generated.blog_post);

      toast.success('🎉 Weekly wrap-up generated!');
    } catch (error) {
      console.error('Error generating wrap-up:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(platform);
    toast.success(`${platform} post copied to clipboard!`);
    
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleRegenerate = () => {
    generateWrapup();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Sparkles className="h-12 w-12 text-violet-600 mx-auto animate-pulse" />
          <Paragraph variant="muted">Loading weekly wrap-up...</Paragraph>
        </div>
      </div>
    );
  }

  if (!goal) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100">
              <Trophy className="h-8 w-8 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Heading as="h1" className="text-gray-900">
                  Weekly Wrap-up
                </Heading>
                <Badge className="bg-violet-100 text-violet-700">
                  Complete
                </Badge>
              </div>
              <Paragraph className="text-gray-700 mb-2">
                {goal.title}
              </Paragraph>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  goal.type === 'learning' 
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-violet-100 text-violet-700 border-violet-200'
                }>
                  {goal.type === 'learning' ? '📚 Learning' : '🚀 Product'}
                </Badge>
                {stats && (
                  <Paragraph variant="small" className="text-gray-500">
                    • {stats.daysToComplete} days • {stats.totalCodeLines} lines of code
                  </Paragraph>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleRegenerate}
            disabled={isGenerating}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </Card>

      {/* Stats Card */}
      {stats && (
        <Card className="p-6">
          <Heading as="h2" className="text-gray-900 text-lg mb-4">
            Week in Review
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                <Paragraph variant="small" className="text-blue-700 font-medium">
                  Duration
                </Paragraph>
              </div>
              <Paragraph className="text-2xl font-bold text-blue-900">
                {stats.daysToComplete} days
              </Paragraph>
            </div>
            <div className="p-4 rounded-lg bg-green-50">
              <div className="flex items-center gap-2 mb-1">
                <Code className="h-4 w-4 text-green-600" />
                <Paragraph variant="small" className="text-green-700 font-medium">
                  Code Written
                </Paragraph>
              </div>
              <Paragraph className="text-2xl font-bold text-green-900">
                {stats.totalCodeLines} lines
              </Paragraph>
            </div>
            <div className="p-4 rounded-lg bg-amber-50">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-amber-600" />
                <Paragraph variant="small" className="text-amber-700 font-medium">
                  Notes
                </Paragraph>
              </div>
              <Paragraph className="text-2xl font-bold text-amber-900">
                {stats.totalNotesLength.toLocaleString()} chars
              </Paragraph>
            </div>
            <div className="p-4 rounded-lg bg-violet-50">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-violet-600" />
                <Paragraph variant="small" className="text-violet-700 font-medium">
                  Tasks Done
                </Paragraph>
              </div>
              <Paragraph className="text-2xl font-bold text-violet-900">
                {stats.totalTasks}/7
              </Paragraph>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Bar for Generation */}
      {isGenerating && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Paragraph className="font-medium text-gray-900">
                Generating weekly wrap-up...
              </Paragraph>
              <Paragraph variant="small" className="text-gray-500">
                {Math.round(progress)}%
              </Paragraph>
            </div>
            <Progress value={progress} className="h-2" />
            <Paragraph variant="small" className="text-gray-500">
              AI is synthesizing your 7 days of work into cohesive content. This takes 15-25 seconds.
            </Paragraph>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 border-violet-200 bg-violet-50/50">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div>
            <Paragraph className="font-medium text-violet-900 mb-1">
              AI-Generated Weekly Summary
            </Paragraph>
            <Paragraph variant="small" className="text-violet-700">
              This content synthesizes all 7 days of your work into platform-optimized posts. 
              Review, edit, and share your week&apos;s journey!
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Content Tabs */}
      {content && !isGenerating && (
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="x" className="gap-2">
                <Twitter className="h-4 w-4" />
                X Thread
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </TabsTrigger>
              <TabsTrigger value="blog" className="gap-2">
                <FileText className="h-4 w-4" />
                Blog Post
              </TabsTrigger>
            </TabsList>

            {/* X Post */}
            <TabsContent value="x" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading as="h3" className="text-gray-900 text-lg">
                    X (Twitter) Thread
                  </Heading>
                  <Paragraph variant="small" className="text-gray-500">
                    Thread format - each tweet separated by ---
                  </Paragraph>
                </div>
                <div className="flex items-center gap-2">
                  <Paragraph variant="small" className={
                    editableX.length > 280 ? 'text-red-600' : 'text-gray-600'
                  }>
                    {editableX.length} chars
                  </Paragraph>
                  <Button
                    onClick={() => handleCopy(editableX, 'X')}
                    variant="outline"
                    className="gap-2"
                  >
                    {copiedTab === 'X' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Textarea
                value={editableX}
                onChange={(e) => setEditableX(e.target.value)}
                rows={10}
                className="font-normal"
              />

              {editableX.length > 280 && (
                <Paragraph variant="small" className="text-red-600">
                  ⚠️ Some tweets may exceed 280 character limit. Review before posting.
                </Paragraph>
              )}
            </TabsContent>

            {/* LinkedIn Post */}
            <TabsContent value="linkedin" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading as="h3" className="text-gray-900 text-lg">
                    LinkedIn Post
                  </Heading>
                  <Paragraph variant="small" className="text-gray-500">
                    Professional weekly recap format
                  </Paragraph>
                </div>
                <div className="flex items-center gap-2">
                  <Paragraph variant="small" className={
                    editableLinkedIn.length < 1300 || editableLinkedIn.length > 3000
                      ? 'text-amber-600'
                      : 'text-green-600'
                  }>
                    {editableLinkedIn.length} characters
                  </Paragraph>
                  <Button
                    onClick={() => handleCopy(editableLinkedIn, 'LinkedIn')}
                    variant="outline"
                    className="gap-2"
                  >
                    {copiedTab === 'LinkedIn' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Textarea
                value={editableLinkedIn}
                onChange={(e) => setEditableLinkedIn(e.target.value)}
                rows={14}
                className="font-normal"
              />
            </TabsContent>

            {/* Blog Post */}
            <TabsContent value="blog" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading as="h3" className="text-gray-900 text-lg">
                    Blog Post
                  </Heading>
                  <Paragraph variant="small" className="text-gray-500">
                    Full weekly recap with markdown formatting
                  </Paragraph>
                </div>
                <div className="flex items-center gap-2">
                  <Paragraph variant="small" className="text-gray-600">
                    {editableBlog.split(' ').filter(w => w.length > 0).length} words
                  </Paragraph>
                  <Button
                    onClick={() => handleCopy(editableBlog, 'Blog')}
                    variant="outline"
                    className="gap-2"
                  >
                    {copiedTab === 'Blog' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Textarea
                value={editableBlog}
                onChange={(e) => setEditableBlog(e.target.value)}
                rows={24}
                className="font-mono text-sm"
              />

              <div className="p-3 rounded-lg bg-gray-50 border">
                <Paragraph variant="small" className="text-gray-600">
                  💡 This content includes markdown formatting (# headers, **bold**, ```code blocks```, etc.)
                </Paragraph>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
