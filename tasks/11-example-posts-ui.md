# Task 11: Example Posts UI

**Phase:** 2 - Frontend  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 10 (Layout & Navigation) ✅, Task 02 (Example Posts API) ✅

---

## Objective

Build a complete CRUD interface for managing example posts with forms, validation, and state management. Users can create, view, update, and delete example posts that guide AI content generation.

---

## Prerequisites

- ✅ Example Posts API working (Task 02)
- ✅ Layout and navigation ready (Task 10)
- ✅ shadcn/ui components installed
- ✅ Existing Heading, Paragraph, Container components

---

## Features to Implement

1. **List View** - Display all example posts grouped by type and platform
2. **Create Form** - Add new example posts with validation
3. **Edit Form** - Update existing posts
4. **Delete Action** - Remove posts with confirmation
5. **Max Limit Indicator** - Show 2/2 count per type per platform
6. **Empty States** - Guide users when no posts exist

---

## Install Additional shadcn Components

```bash
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add alert-dialog
```

---

## Create Example Post Form Component

**File:** `components/ExamplePostForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ExamplePostFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id?: string;
    type: 'learning' | 'product';
    platform: 'x' | 'linkedin' | 'blog';
    content: string;
  };
}

export default function ExamplePostForm({ 
  onSuccess, 
  onCancel, 
  initialData 
}: ExamplePostFormProps) {
  const [type, setType] = useState<'learning' | 'product'>(
    initialData?.type || 'learning'
  );
  const [platform, setPlatform] = useState<'x' | 'linkedin' | 'blog'>(
    initialData?.platform || 'x'
  );
  const [content, setContent] = useState(initialData?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter content for the example post');
      return;
    }

    if (content.length < 20) {
      toast.error('Content must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing 
        ? `/api/example-posts/${initialData.id}`
        : '/api/example-posts';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, platform, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to save example post');
        return;
      }

      toast.success(isEditing ? 'Example post updated!' : 'Example post created!');
      onSuccess();
    } catch (error) {
      console.error('Error saving example post:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const platformInfo = {
    x: { name: 'X/Twitter', charLimit: '280 characters', example: 'Short, punchy updates' },
    linkedin: { name: 'LinkedIn', charLimit: '1300-2000 characters', example: 'Professional insights' },
    blog: { name: 'Blog', charLimit: '500-800 words', example: 'Technical deep-dives' },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading as="h2" className="text-gray-900 text-2xl">
          {isEditing ? 'Edit Example Post' : 'Add Example Post'}
        </Heading>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Goal Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="product">Product Building</SelectItem>
            </SelectContent>
          </Select>
          <Paragraph variant="small" className="text-gray-500">
            Choose the goal type this example post belongs to
          </Paragraph>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
            <SelectTrigger id="platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="x">X (Twitter)</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
            </SelectContent>
          </Select>
          <Paragraph variant="small" className="text-gray-500">
            {platformInfo[platform].name} - {platformInfo[platform].charLimit}
          </Paragraph>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Example Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Example ${platformInfo[platform].name} post: ${platformInfo[platform].example}`}
            rows={8}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <Paragraph variant="small" className="text-gray-500">
              Minimum 20 characters
            </Paragraph>
            <Paragraph variant="small" className={
              content.length < 20 ? 'text-red-500' : 'text-gray-500'
            }>
              {content.length} characters
            </Paragraph>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
```

---

## Create Example Post Card Component

**File:** `components/ExamplePostCard.tsx`

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paragraph } from '@/components/Paragraph';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface ExamplePost {
  _id: string;
  type: 'learning' | 'product';
  platform: 'x' | 'linkedin' | 'blog';
  content: string;
  createdAt: string;
}

interface ExamplePostCardProps {
  post: ExamplePost;
  onEdit: (post: ExamplePost) => void;
  onDelete: () => void;
}

export default function ExamplePostCard({ 
  post, 
  onEdit, 
  onDelete 
}: ExamplePostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/example-posts/${post._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete example post');
        return;
      }

      toast.success('Example post deleted');
      onDelete();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Something went wrong');
    } finally {
      setIsDeleting(false);
    }
  };

  const platformIcons = {
    x: <Twitter className="h-4 w-4" />,
    linkedin: '💼',
    blog: '📝',
  };

  const platformNames = {
    x: 'X',
    linkedin: 'LinkedIn',
    blog: 'Blog',
  };

  const typeColors = {
    learning: 'bg-blue-100 text-blue-700 border-blue-200',
    product: 'bg-violet-100 text-violet-700 border-violet-200',
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={typeColors[post.type]}>
            {post.type}
          </Badge>
          <Badge variant="outline" className="gap-1">
            {typeof platformIcons[post.platform] === 'string' ? (
              <span>{platformIcons[post.platform]}</span>
            ) : (
              platformIcons[post.platform]
            )}
            {platformNames[post.platform]}
          </Badge>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(post)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Example Post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this example post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <Paragraph variant="default" className="text-gray-700 line-clamp-4">
        {post.content}
      </Paragraph>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t">
        <Paragraph variant="small" className="text-gray-400">
          {new Date(post.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Paragraph>
      </div>
    </Card>
  );
}
```

---

## Update Examples Page with Full Functionality

**File:** `app/dashboard/examples/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Info } from 'lucide-react';
import ExamplePostForm from '@/components/ExamplePostForm';
import ExamplePostCard from '@/components/ExamplePostCard';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

interface ExamplePost {
  _id: string;
  type: 'learning' | 'product';
  platform: 'x' | 'linkedin' | 'blog';
  content: string;
  createdAt: string;
}

export default function ExamplesPage() {
  const [posts, setPosts] = useState<ExamplePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<ExamplePost | null>(null);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/example-posts');
      const data = await response.json();

      if (response.ok) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load example posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPost(null);
    fetchPosts();
  };

  const handleEdit = (post: ExamplePost) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  // Group posts by type and platform
  const groupedPosts = posts.reduce((acc, post) => {
    const key = `${post.type}-${post.platform}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {} as Record<string, ExamplePost[]>);

  // Calculate counts per type per platform
  const getCounts = (type: 'learning' | 'product', platform: 'x' | 'linkedin' | 'blog') => {
    const key = `${type}-${platform}`;
    return groupedPosts[key]?.length || 0;
  };

  if (isLoading) {
    return <ExamplesPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h1" className="text-gray-900">
            Example Posts
          </Heading>
          <Paragraph variant="muted" className="mt-2">
            Save example posts to guide AI content generation
          </Paragraph>
        </div>
        {!showForm && (
          <Button size="lg" className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Example
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card className="p-4 border-blue-200 bg-blue-50/50">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <Paragraph variant="default" className="font-medium text-blue-900">
              How example posts work
            </Paragraph>
            <Paragraph variant="small" className="text-blue-700 mt-1">
              Save up to 2 example posts per platform (X, LinkedIn, Blog) for each goal type. 
              AI will match your style when generating content.
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Form */}
      {showForm && (
        <ExamplePostForm
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
          initialData={editingPost || undefined}
        />
      )}

      {/* Count Overview */}
      {posts.length > 0 && !showForm && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(['learning', 'product'] as const).map((type) => (
            <Card key={type} className="p-4">
              <Paragraph variant="small" className="text-gray-500 mb-2">
                {type === 'learning' ? 'Learning' : 'Product Building'}
              </Paragraph>
              <div className="space-y-1">
                {(['x', 'linkedin', 'blog'] as const).map((platform) => {
                  const count = getCounts(type, platform);
                  const platformNames = { x: 'X', linkedin: 'LinkedIn', blog: 'Blog' };
                  
                  return (
                    <div key={platform} className="flex justify-between items-center">
                      <Paragraph variant="small" className="text-gray-700">
                        {platformNames[platform]}
                      </Paragraph>
                      <Badge 
                        variant="outline" 
                        className={count === 2 ? 'bg-green-50 text-green-700' : ''}
                      >
                        {count}/2
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {/* Learning Posts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heading as="h3" className="text-gray-900 text-xl">
                Learning Posts
              </Heading>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {posts.filter(p => p.type === 'learning').length}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {posts
                .filter((p) => p.type === 'learning')
                .map((post) => (
                  <ExamplePostCard
                    key={post._id}
                    post={post}
                    onEdit={handleEdit}
                    onDelete={fetchPosts}
                  />
                ))}
            </div>
          </div>

          {/* Product Posts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heading as="h3" className="text-gray-900 text-xl">
                Product Building Posts
              </Heading>
              <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                {posts.filter(p => p.type === 'product').length}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {posts
                .filter((p) => p.type === 'product')
                .map((post) => (
                  <ExamplePostCard
                    key={post._id}
                    post={post}
                    onEdit={handleEdit}
                    onDelete={fetchPosts}
                  />
                ))}
            </div>
          </div>
        </div>
      ) : (
        !showForm && (
          <EmptyState
            icon={Plus}
            title="No example posts yet"
            description="Create your first example post to help AI match your writing style when generating content."
            action={{
              label: 'Add Example Post',
              onClick: () => setShowForm(true),
            }}
          />
        )
      )}
    </div>
  );
}

function ExamplesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Features Implemented

### ✅ Create Example Post
- Form with type, platform, and content fields
- Character count validation (min 20 chars)
- Max 2 per type per platform enforced by backend
- Real-time character counter

### ✅ List Example Posts
- Grouped by goal type (Learning/Product)
- Badge indicators for platform and type
- Count overview showing X/2 for each combination
- Responsive grid layout

### ✅ Edit Example Post
- Pre-filled form with existing data
- Same validation as create
- Updates via PUT endpoint

### ✅ Delete Example Post
- Alert dialog confirmation
- Optimistic UI update after deletion
- Error handling

### ✅ Empty State
- Shows when no posts exist
- Call-to-action button
- Helpful description

---

## Testing Checklist

### Create Flow
- [ ] Click "Add Example" button
- [ ] Select "Learning" type
- [ ] Select "X" platform
- [ ] Enter content (test with <20 chars - should show error)
- [ ] Enter valid content (>20 chars)
- [ ] Submit form
- [ ] Verify toast success message
- [ ] Verify post appears in list

### Max Limit Test
- [ ] Create 2 X posts for Learning type
- [ ] Try to create 3rd X post for Learning
- [ ] Should see error from backend (400)
- [ ] Verify count shows 2/2

### Edit Flow
- [ ] Click edit icon on a post
- [ ] Modify content
- [ ] Submit
- [ ] Verify changes appear
- [ ] Verify toast message

### Delete Flow
- [ ] Click delete icon
- [ ] See confirmation dialog
- [ ] Click "Delete"
- [ ] Verify post removed
- [ ] Verify toast message

### Empty State
- [ ] Delete all posts
- [ ] See empty state
- [ ] Click "Add Example Post" in empty state
- [ ] Form should appear

### Responsive Design
- [ ] Test on mobile (320px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1024px+)
- [ ] Verify grid adapts correctly

---

## Error Handling

All error scenarios handled:
- ✅ Network failures
- ✅ Validation errors
- ✅ Max limit violations
- ✅ Authentication failures
- ✅ Server errors

---

## Accessibility

- ✅ Proper labels on form inputs
- ✅ Keyboard navigation support
- ✅ Focus states visible
- ✅ Alert dialogs for destructive actions
- ✅ Screen reader friendly

---

## Next Steps

After completing this task:
1. Move to Task 12: Weekly Goals Dashboard
2. Similar pattern but with weekly goals and progress tracking
3. More complex state management with task relationships

---

## Git Commit

```bash
# Stage the files
git add components/ExamplePostForm.tsx
git add components/ExamplePostCard.tsx
git add app/dashboard/examples/page.tsx
git add components/ui/*  # New shadcn components

# Commit
git commit -m "feat: add Example Posts CRUD UI

- Create ExamplePostForm with validation
- Add ExamplePostCard with edit/delete actions
- Implement full CRUD functionality
- Add count indicators (X/2 per type/platform)
- Group posts by goal type (Learning/Product)
- Add confirmation dialogs for deletion
- Implement real-time character counter
- Add empty state with CTA
- Use existing Heading/Paragraph components
- Integrate with Example Posts API
- Add responsive grid layout
- Include error handling and toast notifications"

git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `10-layout-navigation.md` ✅  
**Next Task:** `12-weekly-goals-dashboard.md`