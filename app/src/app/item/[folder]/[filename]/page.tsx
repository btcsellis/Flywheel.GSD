import { getWorkItem, type WorkItem, type WorkItemStatus } from '@/lib/work-items';
import { notFound } from 'next/navigation';
import { WorkItemDetail } from './work-item-detail';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ folder: string; filename: string }>;
}

export default async function WorkItemPage({ params }: Props) {
  const { folder, filename } = await params;
  const validFolder = folder as 'backlog' | 'active' | 'done';
  const item = await getWorkItem(validFolder, decodeURIComponent(filename));

  if (!item) {
    notFound();
  }

  return <WorkItemDetail item={item} />;
}
