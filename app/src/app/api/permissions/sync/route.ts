import { NextResponse } from 'next/server';
import { syncGlobalToAreas } from '@/lib/permissions';

export async function POST() {
  try {
    await syncGlobalToAreas();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync permissions:', error);
    return NextResponse.json(
      { error: 'Failed to sync permissions' },
      { status: 500 }
    );
  }
}
