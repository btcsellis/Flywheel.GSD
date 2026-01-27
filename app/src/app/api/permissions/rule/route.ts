import { NextRequest, NextResponse } from 'next/server';
import { writeGlobalRule, writeAreaRule, writeProjectRule } from '@/lib/permissions';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rule, scope, enabled } = body as {
      rule: string;
      scope: 'global' | string;
      enabled: boolean;
    };

    if (!rule || typeof rule !== 'string') {
      return NextResponse.json(
        { error: 'rule must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!scope || typeof scope !== 'string') {
      return NextResponse.json(
        { error: 'scope must be "global" or a project path' },
        { status: 400 }
      );
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    if (scope === 'global') {
      await writeGlobalRule(rule, enabled);
    } else if (scope.startsWith('area:')) {
      const areaValue = scope.slice(5);
      await writeAreaRule(areaValue, rule, enabled);
    } else {
      await writeProjectRule(scope, rule, enabled);
    }

    return NextResponse.json({ success: true, rule, scope, enabled });
  } catch (error) {
    console.error('Failed to toggle rule:', error);
    return NextResponse.json(
      { error: 'Failed to toggle rule' },
      { status: 500 }
    );
  }
}
