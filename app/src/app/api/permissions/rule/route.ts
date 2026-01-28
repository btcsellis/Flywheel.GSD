import { NextRequest, NextResponse } from 'next/server';
import {
  writeGlobalRule,
  writeAreaRule,
  writeProjectRule,
  readGlobalRawRules,
  readAreaRawRules,
  readProjectRawRules,
  writeCustomCategory,
  deleteCustomCategory,
} from '@/lib/permissions';

/**
 * Build rule string from tool and pattern
 */
function buildRuleString(tool: string, pattern: string | null): string {
  if (pattern) {
    return `${tool}(${pattern})`;
  }
  return tool;
}

/**
 * POST - Create a new rule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, pattern, category, scope } = body as {
      tool: string;
      pattern?: string | null;
      category: string;
      scope: 'global' | string;
    };

    if (!tool || typeof tool !== 'string') {
      return NextResponse.json(
        { error: 'tool must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!scope || typeof scope !== 'string') {
      return NextResponse.json(
        { error: 'scope must be "global", "area:<name>", or a project path' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'category must be a non-empty string' },
        { status: 400 }
      );
    }

    const rule = buildRuleString(tool, pattern || null);

    // Check for duplicates
    let existingRules: string[];
    if (scope === 'global') {
      existingRules = await readGlobalRawRules();
    } else if (scope.startsWith('area:')) {
      const areaValue = scope.slice(5);
      existingRules = await readAreaRawRules(areaValue);
    } else {
      existingRules = await readProjectRawRules(scope);
    }

    if (existingRules.includes(rule)) {
      return NextResponse.json(
        { error: 'Rule already exists at this scope' },
        { status: 409 }
      );
    }

    // Add the rule
    if (scope === 'global') {
      await writeGlobalRule(rule, true);
    } else if (scope.startsWith('area:')) {
      const areaValue = scope.slice(5);
      await writeAreaRule(areaValue, rule, true);
    } else {
      await writeProjectRule(scope, rule, true);
    }

    // Save custom category mapping
    await writeCustomCategory(scope, rule, category);

    return NextResponse.json({ success: true, rule, scope, category });
  } catch (error) {
    console.error('Failed to create rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Toggle a rule on/off (existing functionality)
 */
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
        { error: 'scope must be "global", "area:<name>", or a project path' },
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

/**
 * DELETE - Remove a rule
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { rule, scope } = body as {
      rule: string;
      scope: 'global' | string;
    };

    if (!rule || typeof rule !== 'string') {
      return NextResponse.json(
        { error: 'rule must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!scope || typeof scope !== 'string') {
      return NextResponse.json(
        { error: 'scope must be "global", "area:<name>", or a project path' },
        { status: 400 }
      );
    }

    // Remove the rule (set enabled to false)
    if (scope === 'global') {
      await writeGlobalRule(rule, false);
    } else if (scope.startsWith('area:')) {
      const areaValue = scope.slice(5);
      await writeAreaRule(areaValue, rule, false);
    } else {
      await writeProjectRule(scope, rule, false);
    }

    // Remove custom category mapping
    await deleteCustomCategory(scope, rule);

    return NextResponse.json({ success: true, rule, scope });
  } catch (error) {
    console.error('Failed to delete rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
