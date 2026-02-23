'use client';

import { useEffect, useState } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, CheckCircle2, Sparkles } from 'lucide-react';
import WeeklyGoalCard from '@/components/WeeklyGoalCard';
import NewWeeklyGoalModal from '@/components/NewWeeklyGoalModal';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

interface WeeklyGoal {
  _id: string;
  title: string;
  type: 'learning' | 'product';
  status: 'active' | 'complete';
  startDate: string;
  completedAt?: string;
  taskStats?: {
    total: number;
    completed: number;
    progress: number;
  };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/weekly-goals');
      const data = await response.json();

      if (response.ok) {
        setGoals(data.data);
      } else {
        toast.error(data.error || 'Failed to load goals');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load weekly goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Calculate stats
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'complete');
  const learningGoals = goals.filter(g => g.type === 'learning');
  const productGoals = goals.filter(g => g.type === 'product');

  // Filter goals based on tab
  const filteredGoals = activeTab === 'all' 
    ? goals 
    : activeTab === 'active' 
      ? activeGoals 
      : completedGoals;

  if (isLoading) {
    return <GoalsPageSkeleton />;
  }

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
        <Button size="lg" className="gap-2" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New Week
        </Button>
      </div>

      {/* Stats Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Paragraph className="text-2xl font-bold text-gray-900">
                  {activeGoals.length}
                </Paragraph>
                <Paragraph variant="small" className="text-gray-500">
                  Active
                </Paragraph>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <Paragraph className="text-2xl font-bold text-gray-900">
                  {completedGoals.length}
                </Paragraph>
                <Paragraph variant="small" className="text-gray-500">
                  Completed
                </Paragraph>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <Paragraph className="text-2xl font-bold text-gray-900">
                  {learningGoals.length}
                </Paragraph>
                <Paragraph variant="small" className="text-gray-500">
                  Learning
                </Paragraph>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <Paragraph className="text-2xl font-bold text-gray-900">
                  {productGoals.length}
                </Paragraph>
                <Paragraph variant="small" className="text-gray-500">
                  Product
                </Paragraph>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Goals List with Tabs */}
      {goals.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {goals.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">
                {activeGoals.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="complete">
              Completed
              <Badge variant="secondary" className="ml-2">
                {completedGoals.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredGoals.map((goal) => (
                <WeeklyGoalCard key={goal._id} goal={goal} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          icon={Target}
          title="No weekly goals yet"
          description="Create your first weekly goal to start tracking your progress. Each week focuses on one learning or product-building objective."
          action={{
            label: 'Create First Goal',
            onClick: () => setShowModal(true),
          }}
        />
      )}

      {/* New Goal Modal */}
      <NewWeeklyGoalModal 
        open={showModal} 
        onOpenChange={setShowModal} 
      />
    </div>
  );
}

function GoalsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-4 w-16 mt-1" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
