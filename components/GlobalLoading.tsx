'use client';

import { Sparkles } from 'lucide-react';
import { Paragraph } from '@/components/Paragraph';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      <div className="text-center space-y-4">
        <Sparkles className="h-12 w-12 text-blue-600 mx-auto animate-pulse" />
        <Paragraph variant="muted">Loading...</Paragraph>
      </div>
    </div>
  );
}
