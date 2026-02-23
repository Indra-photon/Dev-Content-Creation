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
          initialData={editingPost ? { ...editingPost, id: editingPost._id } : undefined}
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
