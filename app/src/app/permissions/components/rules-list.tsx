'use client';

import { cn } from '@/lib/utils';

interface ParsedRule {
  tool: string;
  pattern: string | null;
  raw: string;
}

interface RuleWithSource {
  rule: ParsedRule;
  source: 'global' | 'project';
  isOverride: boolean;
  isCustom: boolean;
}

function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'global' | 'project' | 'override' | 'custom';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
        variant === 'default' && 'bg-zinc-700 text-zinc-300',
        variant === 'global' && 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
        variant === 'project' && 'bg-green-900/50 text-green-300 border border-green-700/50',
        variant === 'override' && 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
        variant === 'custom' && 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
      )}
    >
      {children}
    </span>
  );
}

interface RulesListProps {
  rules: RuleWithSource[];
  showSource?: boolean;
  emptyMessage?: string;
}

export function RulesList({ rules, showSource = true, emptyMessage = 'No rules defined' }: RulesListProps) {
  if (rules.length === 0) {
    return (
      <div className="text-sm text-zinc-500 italic py-2">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {rules.map((item, idx) => (
        <div
          key={`${item.rule.raw}-${idx}`}
          className="flex items-start gap-2 p-2 rounded bg-zinc-800/50 border border-zinc-700/50"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-zinc-200">
                {item.rule.tool}
              </span>
              {item.rule.pattern && (
                <span className="font-mono text-xs text-zinc-400">
                  ({item.rule.pattern})
                </span>
              )}
              {showSource && (
                <Badge variant={item.source}>
                  {item.source}
                </Badge>
              )}
              {item.isOverride && (
                <Badge variant="override">
                  override
                </Badge>
              )}
              {item.isCustom && (
                <Badge variant="custom">
                  custom
                </Badge>
              )}
            </div>
            <div className="font-mono text-[10px] text-zinc-500 truncate mt-0.5" title={item.rule.raw}>
              {item.rule.raw}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
