import Link from 'next/link';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Container } from '@/components/Container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Target, Lock, Sparkles, TrendingUp } from 'lucide-react';

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard/goals');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      {/* Hero Section */}
      <Container className="py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Stay Focused. Build Consistency.
          </div>
          
          <Heading as="h1" className="text-gray-900">
            Master Skills with
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Focused Weekly Goals
            </span>
          </Heading>
          
          <Paragraph className="max-w-2xl mx-auto">
            A productivity system that enforces focus. Complete 7 daily tasks before moving to the next week. 
            No skipping, no distractions.
          </Paragraph>

          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <Card className="p-6 border-2 hover:border-blue-200 transition-colors">
            <div className="p-3 w-fit rounded-lg bg-blue-100 text-blue-600 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <Heading as="h3" className="text-gray-900 text-lg mb-2">
              Sequential Lock System
            </Heading>
            <Paragraph variant="muted">
              Day 2 unlocks only after Day 1 is complete. Forces you to finish what you start.
            </Paragraph>
          </Card>

          <Card className="p-6 border-2 hover:border-violet-200 transition-colors">
            <div className="p-3 w-fit rounded-lg bg-violet-100 text-violet-600 mb-4">
              <Target className="h-6 w-6" />
            </div>
            <Heading as="h3" className="text-gray-900 text-lg mb-2">
              Weekly Focus
            </Heading>
            <Paragraph variant="muted">
              Can&apos;t create Week 2 until Week 1 is 100% done. One week at a time.
            </Paragraph>
          </Card>

          <Card className="p-6 border-2 hover:border-green-200 transition-colors">
            <div className="p-3 w-fit rounded-lg bg-green-100 text-green-600 mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <Heading as="h3" className="text-gray-900 text-lg mb-2">
              AI Content Generation
            </Heading>
            <Paragraph variant="muted">
              Auto-generate social posts from your work. Share your progress effortlessly.
            </Paragraph>
          </Card>
        </div>
      </Container>
    </div>
  );
}
