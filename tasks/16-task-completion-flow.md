# Task 16: Content Generation UI

**Phase:** 2 - Frontend  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 15 (Task Completion) ✅, Task 07 (Content Generation API) ✅

---

## Objective

Build the content generation interface that displays AI-generated X, LinkedIn, and Blog posts in tabs. Users can copy content, regenerate, or edit before sharing.

---

## Prerequisites

- ✅ Task Completion Flow complete (Task 15)
- ✅ Content Generation API working (Task 07)
- ✅ shadcn/ui components installed

---

## Create Content Generation Page

**File:** `app/dashboard/goals/[id]/tasks/[taskId]/generate/page.tsx`

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
import { ArrowLeft, Copy, Check, RefreshCw, Sparkles, Twitter, Linkedin, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedContent {
  x_post: string;
  linkedin_post: string;
  blog_post: string;
}

interface DailyTask {
  _id: string;
  dayNumber: number;
  description: string;
  status: string;
  completionData?: {
    code: string;
    learningNotes: string;
    completedAt: string;
  };
}

interface WeeklyGoal {
  _id: string;
  title: string;
  type: 'learning' | 'product';
}

export default function ContentGenerationPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<DailyTask | null>(null);
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('x');

  // Editable content states
  const [editableX, setEditableX] = useState('');
  const [editableLinkedIn, setEditableLinkedIn] = useState('');
  const [editableBlog, setEditableBlog] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task
        const taskResponse = await fetch(`/api/daily-tasks/${params.taskId}`);
        const taskData = await taskResponse.json();

        if (!taskResponse.ok || taskData.data.status !== 'complete') {
          toast.error('Task must be completed first');
          router.push(`/dashboard/goals/${params.id}`);
          return;
        }

        // Fetch goal
        const goalResponse = await fetch(`/api/weekly-goals/${params.id}`);
        const goalData = await goalResponse.json();

        setTask(taskData.data);
        setGoal(goalData.data);
        
        // Auto-generate on first load
        await generateContent(taskData.data._id);
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

  const generateContent = async (taskId: string) => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to generate content');
        return;
      }

      const generated = data.data.generatedContent;
      setContent(generated);
      setEditableX(generated.x_post);
      setEditableLinkedIn(generated.linkedin_post);
      setEditableBlog(generated.blog_post);

      toast.success('Content generated!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
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
    if (task) {
      generateContent(task._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Sparkles className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
          <Paragraph variant="muted">Generating content...</Paragraph>
        </div>
      </div>
    );
  }

  if (!task || !goal) return null;

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
            <div className="p-3 rounded-lg bg-violet-100">
              <Sparkles className="h-6 w-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Heading as="h1" className="text-gray-900">
                  Generated Content
                </Heading>
                <Badge className="bg-violet-100 text-violet-700">
                  Day {task.dayNumber}
                </Badge>
              </div>
              <Paragraph className="text-gray-700 mb-2">
                {task.description}
              </Paragraph>
              <Badge variant="outline" className={
                goal.type === 'learning' 
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-violet-100 text-violet-700 border-violet-200'
              }>
                {goal.type === 'learning' ? '📚 Learning' : '🚀 Product'}
              </Badge>
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

      {/* Info Card */}
      <Card className="p-4 border-blue-200 bg-blue-50/50">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <Paragraph className="font-medium text-blue-900 mb-1">
              AI-Generated Content
            </Paragraph>
            <Paragraph variant="small" className="text-blue-700">
              Review the generated posts below. You can edit them before copying. Each platform has different 
              character limits and tone optimized for that audience.
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
                X Post
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </TabsTrigger>
              <TabsTrigger value="blog" className="gap-2">
                <FileText className="h-4 w-4" />
                Blog
              </TabsTrigger>
            </TabsList>

            {/* X Post */}
            <TabsContent value="x" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Heading as="h3" className="text-gray-900 text-lg">
                    X (Twitter) Post
                  </Heading>
                  <Paragraph variant="small" className="text-gray-500">
                    Max 280 characters - short and engaging
                  </Paragraph>
                </div>
                <div className="flex items-center gap-2">
                  <Paragraph variant="small" className={
                    editableX.length > 280 ? 'text-red-600' : 'text-gray-600'
                  }>
                    {editableX.length}/280
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
                rows={4}
                className="font-normal"
              />

              {editableX.length > 280 && (
                <Paragraph variant="small" className="text-red-600">
                  ⚠️ Post exceeds 280 character limit
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
                    1300-2000 characters - professional and detailed
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
                rows={12}
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
                    500-800 words - technical and in-depth with markdown
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
                rows={20}
                className="font-mono text-sm"
              />

              <div className="p-3 rounded-lg bg-gray-50 border">
                <Paragraph variant="small" className="text-gray-600">
                  💡 This content includes markdown formatting (# headers, **bold**, etc.)
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
            Generating Content...
          </Heading>
          <Paragraph variant="muted">
            AI is analyzing your code and notes to create personalized posts. This may take 10-15 seconds.
          </Paragraph>
        </Card>
      )}
    </div>
  );
}
```

---

## Testing Checklist

### Page Load
- [ ] Navigate to generate page for completed task
- [ ] Should auto-generate content on load
- [ ] See loading state with sparkles icon
- [ ] Content appears in tabs after ~10-15s

### X Post Tab
- [ ] Switch to X tab
- [ ] See post content
- [ ] Character count shows X/280
- [ ] Count turns red if >280
- [ ] Edit post text
- [ ] Character count updates
- [ ] Click "Copy" button
- [ ] See "Copied!" confirmation
- [ ] Paste in another app - should work

### LinkedIn Post Tab
- [ ] Switch to LinkedIn tab
- [ ] See longer post content
- [ ] Character count shows total
- [ ] Count green if 1300-3000 range
- [ ] Count amber if outside range
- [ ] Edit post text
- [ ] Click "Copy" button
- [ ] Content copied correctly

### Blog Post Tab
- [ ] Switch to Blog tab
- [ ] See markdown-formatted content
- [ ] Word count shows (not characters)
- [ ] See markdown formatting preserved
- [ ] Edit content
- [ ] Markdown stays intact
- [ ] Copy button works

### Regenerate
- [ ] Click "Regenerate" button
- [ ] Button shows loading spinner
- [ ] New content generated
- [ ] All three tabs updated
- [ ] Can regenerate multiple times

### Error Handling
- [ ] Navigate to uncompleted task's generate page
- [ ] Should redirect with error
- [ ] Try with invalid task ID
- [ ] Should redirect with error

### Responsive Design
- [ ] Test on mobile - tabs stack
- [ ] Textareas resize properly
- [ ] Copy buttons accessible
- [ ] Character counts visible

---

## Features Implemented

✅ **Auto-generation on Load** - Content generates automatically  
✅ **Three Platform Tabs** - X, LinkedIn, Blog with icons  
✅ **Editable Content** - Can modify before copying  
✅ **Character/Word Counters** - Different limits per platform  
✅ **Copy to Clipboard** - One-click copy with confirmation  
✅ **Regenerate Function** - Get fresh content  
✅ **Loading States** - Spinner and progress messages  
✅ **Platform-Specific Guidance** - Character limits explained  
✅ **Color-Coded Counters** - Red for over limit, green for good  
✅ **Markdown Support** - Blog post with formatting  

---

## Platform Limits

| Platform | Limit | Counter Color Logic |
|----------|-------|---------------------|
| X | 280 chars max | Red if >280 |
| LinkedIn | 1300-3000 chars ideal | Green if in range, amber if not |
| Blog | 500-800 words | Gray (no strict limit) |

---

## UX Features

### Copy Feedback:
- Button text changes to "Copied!"
- Check icon appears
- Toast notification
- Reverts after 2 seconds

### Regenerate:
- Spinner on button
- Loading card appears
- All tabs update simultaneously
- Success toast

### Real-time Editing:
- Can edit any tab
- Changes persist between tabs
- Character counts update live
- Copy always gets current edited version

---

## Next Steps

After completing this task:
1. Move to Task 17: Weekly Wrap-up UI
2. Similar pattern but for all 7 days
3. More complex content synthesis

---

## Git Commit

```bash
# Stage the files
git add app/dashboard/goals/[id]/tasks/[taskId]/generate/page.tsx

# Commit
git commit -m "feat: add Content Generation UI

- Create content generation page with auto-load
- Add three platform tabs (X, LinkedIn, Blog)
- Implement editable textareas for all platforms
- Add character/word counters with color coding
- Add copy to clipboard with confirmation
- Add regenerate functionality
- Show loading states with animations
- Add platform-specific guidance
- Display character limit warnings
- Integrate with content generation API
- Use existing Heading/Paragraph components
- Add responsive layout"

git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `15-task-completion-flow.md` ✅  
**Next Task:** `17-weekly-wrapup-ui.md`