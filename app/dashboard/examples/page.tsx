import { Suspense } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function ExamplesPage() {
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
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Example
        </Button>
      </div>

      {/* Info Alert */}
      <Card className="p-4 border-blue-200 bg-blue-50/50">
        <div className="flex gap-3">
          <div className="text-blue-600">ℹ️</div>
          <div className="text-sm">
            <p className="font-medium text-blue-900">How example posts work</p>
            <Paragraph variant="small" className="text-blue-700 mt-1">
              Save up to 2 example posts per platform (X, LinkedIn, Blog) for each goal type. 
              AI will match your style when generating content.
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Examples Grid */}
      <Suspense fallback={<ExamplesGridSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Examples will be loaded here in Task 11 */}
          <Card className="p-8 text-center border-dashed col-span-full">
            <Paragraph variant="muted">
              No example posts yet. Add some to improve AI content generation!
            </Paragraph>
          </Card>
        </div>
      </Suspense>
    </div>
  );
}

function ExamplesGridSkeleton() {
  return (
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
  );
}
