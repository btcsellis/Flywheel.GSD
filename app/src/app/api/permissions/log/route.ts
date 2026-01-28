import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const LOG_FILE_PATH = path.join(
  os.homedir(),
  'personal/flywheel-gsd/permissions/permission-requests.jsonl'
);

export interface PermissionLogEntry {
  id: number; // line number (1-indexed)
  timestamp: string;
  tool: string;
  input: Record<string, unknown>;
  cwd: string;
  project: string;
  session_id: string;
  raw_path: string;
  base_repo_path: string;
}

/**
 * GET - Read all permission log entries
 */
export async function GET() {
  try {
    const content = await fs.readFile(LOG_FILE_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter((line) => line.trim());

    const entries: PermissionLogEntry[] = lines.map((line, index) => {
      const parsed = JSON.parse(line);
      return {
        id: index + 1, // 1-indexed line number
        timestamp: parsed.timestamp,
        tool: parsed.tool,
        input: parsed.input || {},
        cwd: parsed.cwd || '',
        project: parsed.project || '',
        session_id: parsed.session_id || '',
        raw_path: parsed.raw_path || '',
        base_repo_path: parsed.base_repo_path || '',
      };
    });

    // Return in reverse chronological order (newest first)
    entries.reverse();

    return NextResponse.json({ entries });
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ entries: [] });
    }
    console.error('Failed to read permission log:', error);
    return NextResponse.json(
      { error: 'Failed to read permission log' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove specific entries by their IDs (line numbers)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: number[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids must be a non-empty array of line numbers' },
        { status: 400 }
      );
    }

    const content = await fs.readFile(LOG_FILE_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter((line) => line.trim());

    // Filter out the lines to delete (ids are 1-indexed)
    const idsSet = new Set(ids);
    const remainingLines = lines.filter((_, index) => !idsSet.has(index + 1));

    // Write back the remaining lines
    await fs.writeFile(
      LOG_FILE_PATH,
      remainingLines.length > 0 ? remainingLines.join('\n') + '\n' : ''
    );

    return NextResponse.json({
      success: true,
      deleted: ids.length,
      remaining: remainingLines.length,
    });
  } catch (error) {
    console.error('Failed to delete permission log entries:', error);
    return NextResponse.json(
      { error: 'Failed to delete entries' },
      { status: 500 }
    );
  }
}
