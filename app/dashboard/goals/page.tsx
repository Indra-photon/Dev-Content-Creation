import { Suspense } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h1" className="text-gray-900">
            Weekly Goals
          </Heading>
          <Paragraph variant="muted" className="mt-2">
            Track your learning journey, one week at a time
          </Paragraph>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Week
        </Button>
      </div>

      {/* Goals List */}
      <Suspense fallback={<GoalsListSkeleton />}>
        <div className="grid gap-4">
          {/* Goals will be loaded here in Task 12 */}
          <Card className="p-8 text-center border-dashed">
            <Paragraph variant="muted">
              No weekly goals yet. Create your first one to get started!
            </Paragraph>
          </Card>
        </div>
      </Suspense>
    </div>
  );
}

function GoalsListSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
