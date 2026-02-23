import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Container } from '@/components/Container';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      <Container className="py-8">
        {children}
      </Container>
    </div>
  );
}
