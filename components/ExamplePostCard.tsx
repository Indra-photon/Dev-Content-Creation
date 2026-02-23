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
