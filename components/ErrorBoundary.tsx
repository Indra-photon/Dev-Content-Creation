'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="p-4 rounded-full bg-red-100 w-fit mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <Heading as="h2" className="text-gray-900 text-2xl mb-3">
          Something went wrong
        </Heading>
        
        <Paragraph variant="muted" className="mb-6">
          We encountered an unexpected error. Please try again.
        </Paragraph>

        {error.digest && (
          <Paragraph variant="small" className="text-gray-500 mb-6">
            Error ID: {error.digest}
          </Paragraph>
        )}

        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </Card>
    </div>
  );
}
