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
