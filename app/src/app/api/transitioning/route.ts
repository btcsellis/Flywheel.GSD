import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTransitioning,
  markAsTransitioning,
  clearTransitioning,
} from '@/lib/transitioning';

export async function GET() {
  try {
    const transitioning = await getAllTransitioning();
    return NextResponse.json({ transitioning });
  } catch (error) {
    console.error('Failed to get transitioning states:', error);
    return NextResponse.json(
      { error: 'Failed to get transitioning states' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, previousStatus } = body as { id: string; previousStatus: string };

    if (!id || !previousStatus) {
      return NextResponse.json(
        { error: 'id and previousStatus are required' },
        { status: 400 }
      );
    }

    await markAsTransitioning(id, previousStatus);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to mark as transitioning:', error);
    return NextResponse.json(
      { error: 'Failed to mark as transitioning' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    await clearTransitioning(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to clear transitioning:', error);
    return NextResponse.json(
      { error: 'Failed to clear transitioning' },
      { status: 500 }
    );
  }
}
