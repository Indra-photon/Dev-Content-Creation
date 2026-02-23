# Task 17: Weekly Wrap-up UI

**Phase:** 2 - Frontend  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 16 (Content Generation UI) ✅, Task 08 (Weekly Wrap-up API) ✅

---

## Objective

Build the weekly wrap-up interface that generates comprehensive summary content synthesizing all 7 daily tasks. Available only when a week is 100% complete (7/7 tasks done).

---

## Prerequisites

- ✅ Content Generation UI complete (Task 16)
- ✅ Weekly Wrap-up API working (Task 08)
- ✅ Week completion logic working (Task 05)

---

## Create Weekly Wrap-up Page

**File:** `app/dashboard/goals/[id]/wrapup/page.tsx`

```tsx
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
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  Twitter, 
  Linkedin, 
  FileText,
  Calendar,
  TrendingUp,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

interface WrapupContent {
  x_post: string;
  linkedin_post: string;
  blog_post: string;
}

interface WeeklyGoal {
  _id: string;
  title: string;
  type: 'learning' | 'product';
  status: 'active' | 'complete';
  startDate: string;
  completedAt?: string;
}

interface WeekStats {
  totalTasks: number;
  totalCodeLines: number;
  totalNotesLength: number;
  averageNotesPerDay: number;
  daysToComplete: number;
}

export default function WeeklyWrapupPage() {
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [content, setContent] = useState<WrapupContent | null>(null);
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('x');

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

        // Check if week is complete
        if (data.data.status !== 'complete') {
          toast.error('Complete all 7 tasks before generating wrap-up');
          router.push(`/dashboard/goals/${params.id}`);
          return;
        }

        setGoal(data.data);
        
        // Auto-generate on first load
        await generateWrapup(data.data._id);
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

  const generateWrapup = async (goalId: string) => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/content/weekly-wrapup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyGoalId: goalId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to generate wrap-up');
        return;
      }

      const generated = data.data.generatedContent;
      setContent(generated);
      setStats(data.data.weekStats);
      setEditableX(generated.x_post);
      setEditableLinkedIn(generated.linkedin_post);
      setEditableBlog(generated.blog_post);

      toast.success('Weekly wrap-up generated!');
    } catch (error) {
      console.error('Error generating wrap-up:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(platform);
    toast.success(`${platform} wrap-up copied to clipboard!`);
    
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleRegenerate = () => {
    if (goal) {
      generateWrapup(goal._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Sparkles className="h-12 w-12 text-violet-600 mx-auto animate-pulse" />
          <Paragraph variant="muted">Generating your weekly wrap-up...</Paragraph>
          <Paragraph variant="small" className="text-gray-500">
            This may take 15-25 seconds
          </Paragraph>
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
            <div className="p-3 rounded-lg bg-green-100">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Heading as="h1" className="text-gray-900">
                  Weekly Wrap-up
                </Heading>
                <Badge className="bg-green-100 text-green-600">
                  ✓ Complete
                </Badge>
              </div>
              <Heading as="h2" className="text-gray-700 text-xl mb-3">
                {goal.title}
              </Heading>
              <div className="flex items-center gap-4 text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Paragraph variant="small">
                    {new Date(goal.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' - '}
                    {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Paragraph>
                </div>
                <Badge variant="outline" className={
                  goal.type === 'learning' 
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-violet-100 text-violet-700 border-violet-200'
                }>
                  {goal.type === 'learning' ? '📚 Learning' : '🚀 Product'}
                </Badge>
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

      {/* Week Statistics */}
      {stats && (
        <Card className="p-6">
          <Heading as="h3" className="text-gray-900 text-lg mb-4">
            Week Statistics
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <Paragraph variant="small" className="text-blue-700 font-medium">
                  Tasks Completed
                </Paragraph>
              </div>
              <Heading as="h4" className="text-blue-900 text-2xl">
                {stats.totalTasks}/7
              </Heading>
            </div>

            <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
              <div className="flex items-center gap-2 mb-1">
                <Code className="h-4 w-4 text-violet-600" />
                <Paragraph variant="small" className="text-violet-700 font-medium">
                  Code Lines
                </Paragraph>
              </div>
              <Heading as="h4" className="text-violet-900 text-2xl">
                {stats.totalCodeLines}
              </Heading>
            </div>

            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-green-600" />
                <Paragraph variant="small" className="text-green-700 font-medium">
                  Total Notes
                </Paragraph>
              </div>
              <Heading as="h4" className="text-green-900 text-2xl">
                {Math.round(stats.totalNotesLength / 1000)}k
              </Heading>
              <Paragraph variant="small" className="text-green-600">
                characters
              </Paragraph>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-amber-600" />
                <Paragraph variant="small" className="text-amber-700 font-medium">
                  Completion Time
                </Paragraph>
              </div>
              <Heading as="h4" className="text-amber-900 text-2xl">
                {stats.daysToComplete}
              </Heading>
              <Paragraph variant="small" className="text-amber-600">
                days
              </Paragraph>
            </div>
          </div>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 border-violet-200 bg-violet-50/50">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div>
            <Paragraph className="font-medium text-violet-900 mb-1">
              Week Summary Content
            </Paragraph>
            <Paragraph variant="small" className="text-violet-700">
              AI has analyzed all 7 days of your work and created comprehensive summaries. 
              These synthesize your entire week's journey, progress, and learnings.
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Content Tabs */}
      {content && (
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

            {/* X Thread */}
            <TabsContent value="x" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading as="h3" className="text-gray-900 text-lg">
                    X (Twitter) Thread
                  </Heading>
                  <Paragraph variant="small" className="text-gray-500">
                    2-3 tweets summarizing your week - separate with "---"
                  </Paragraph>
                </div>
                <Button
                  onClick={() => handleCopy(editableX, 'X Thread')}
                  variant="outline"
                  className="gap-2"
                >
                  {copiedTab === 'X Thread' ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>

              <Textarea
                value={editableX}
                onChange={(e) => setEditableX(e.target.value)}
                rows={10}
                className="font-normal"
              />

              <div className="p-3 rounded-lg bg-gray-50 border">
                <Paragraph variant="small" className="text-gray-600">
                  💡 Each tweet is separated by "---". Copy all and paste as individual tweets on X.
                </Paragraph>
              </div>
            </TabsContent>

            {/* LinkedIn Post */}
            <TabsContent value="linkedin" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading as="h3" className="text-gray-900 text-lg">
                    LinkedIn Weekly Recap
                  </Heading>
                  <Paragraph variant="small" className="text-gray-500">
                    1500-2500 characters - comprehensive week summary
                  </Paragraph>
                </div>
                <div className="flex items-center gap-2">
                  <Paragraph variant="small" className="text-gray-600">
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
                rows={15}
                className="font-normal"
              />
            </TabsContent>

            {/* Blog Post */}
            <TabsContent value="blog" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading as="h3" className="text-gray-900 text-lg">
                    Blog Post - Week Recap
                  </Heading>
                  <Paragraph variant="small" className="text-gray-500">
                    800-1200 words - detailed weekly journey with all 7 days
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
                rows={25}
                className="font-mono text-sm"
              />

              <div className="p-3 rounded-lg bg-gray-50 border">
                <Paragraph variant="small" className="text-gray-600">
                  💡 Includes markdown formatting with daily breakdown, learnings, and conclusion
                </Paragraph>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 text-violet-600 mx-auto animate-pulse mb-4" />
          <Heading as="h3" className="text-gray-900 text-xl mb-2">
            Generating Weekly Wrap-up...
          </Heading>
          <Paragraph variant="muted" className="mb-4">
            AI is synthesizing all 7 days of your work into comprehensive summaries.
          </Paragraph>
          <Paragraph variant="small" className="text-gray-500">
            This may take 15-25 seconds as it processes your entire week.
          </Paragraph>
        </Card>
      )}
    </div>
  );
}
```

---

## Testing Checklist

### Access Control
- [ ] Try to access wrap-up for incomplete week
- [ ] Should redirect with error toast
- [ ] Access wrap-up for complete week (7/7 tasks)
- [ ] Should load successfully

### Auto-generation
- [ ] Page loads for complete week
- [ ] See loading animation
- [ ] Content generates automatically
- [ ] Takes 15-25 seconds
- [ ] All three tabs populate

### Week Statistics Card
- [ ] See "7/7" tasks completed
- [ ] See total code lines count
- [ ] See total notes character count
- [ ] See days to complete
- [ ] All numbers accurate

### X Thread Tab
- [ ] Switch to X tab
- [ ] See 2-3 tweets separated by "---"
- [ ] Edit content
- [ ] Click "Copy All"
- [ ] Content copied to clipboard
- [ ] See success toast

### LinkedIn Tab
- [ ] Switch to LinkedIn tab
- [ ] See comprehensive week summary
- [ ] Character count shows
- [ ] Edit content
- [ ] Copy button works
- [ ] Content longer than daily posts

### Blog Post Tab
- [ ] Switch to Blog tab
- [ ] See detailed weekly recap
- [ ] Word count shows
- [ ] Markdown formatting visible
- [ ] Daily breakdown included
- [ ] Copy works

### Regenerate Function
- [ ] Click "Regenerate" button
- [ ] Loading state shows
- [ ] New content generated
- [ ] All tabs updated
- [ ] Statistics remain same

### Responsive Design
- [ ] Test on mobile - stats grid stacks
- [ ] Tabs work on small screen
- [ ] Textareas resize properly
- [ ] Copy buttons accessible

---

## Features Implemented

✅ **Week Statistics** - Total tasks, code lines, notes, completion time  
✅ **Auto-generation** - Generates on page load  
✅ **Three Formats** - X thread, LinkedIn post, Blog post  
✅ **Editable Content** - Can modify before copying  
✅ **Thread Support** - X tweets separated by "---"  
✅ **Copy Function** - One-click copy with confirmation  
✅ **Regenerate** - Get fresh summaries  
✅ **Character/Word Counts** - Platform-specific counts  
✅ **Loading States** - 15-25 second generation time  
✅ **Completion Badge** - Shows week is complete  

---

## Differences from Daily Content Generation

| Feature | Daily Generation | Weekly Wrap-up |
|---------|-----------------|----------------|
| Input | 1 day's code/notes | All 7 days synthesized |
| X Format | Single tweet | 2-3 tweet thread |
| Length | Shorter | More comprehensive |
| Generation Time | 10-15s | 15-25s |
| Statistics | None | Week stats card |

---

## Next Steps

After completing this task:
1. Move to Task 18: Responsive Design & Polish
2. Then Task 19: E2E Testing
3. Then Task 20: Deployment Prep

---

## Git Commit

```bash
# Stage the files
git add app/dashboard/goals/[id]/wrapup/page.tsx

# Commit
git commit -m "feat: add Weekly Wrap-up UI

- Create weekly wrap-up page for complete weeks
- Add week statistics card (tasks, code lines, notes, days)
- Implement three platform tabs (X thread, LinkedIn, Blog)
- Add auto-generation on page load
- Add editable content for all platforms
- Implement X thread format with separators
- Add character/word counters
- Add copy to clipboard functionality
- Add regenerate function
- Show 15-25s loading state
- Display completion badge and dates
- Integrate with weekly wrap-up API
- Use existing Heading/Paragraph components
- Add responsive statistics grid"

git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `16-content-generation-ui.md` ✅  
**Next Task:** `18-responsive-polish.md`