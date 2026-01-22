import { getAllWorkItems } from '@/lib/work-items';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { backlog, active } = await getAllWorkItems();

  return (
    <DashboardClient
      initialBacklog={backlog}
      initialActive={active}
    />
  );
}
