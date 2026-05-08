import { requireUser, getCachedProfile } from '@/lib/cache';
import AppShell from '@/components/layout/AppShell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getCachedProfile();

  return (
    <AppShell user={profile}>
      {children}
    </AppShell>
  );
}
