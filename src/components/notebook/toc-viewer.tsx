'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TOCEntry } from '@/types';

interface TOCViewerProps {
  entries: TOCEntry[];
  onClose: () => void;
  onEntryClick?: (entry: TOCEntry) => void;
}

const LEVEL_STYLES: Record<number, { margin: string; text: string; size: string; weight: string; bullet: string }> = {
  1: { margin: 'ml-0', text: 'text-white', size: 'text-sm', weight: 'font-semibold', bullet: '' },
  2: { margin: 'ml-6', text: 'text-zinc-300', size: 'text-[13px]', weight: 'font-normal', bullet: '' },
  3: { margin: 'ml-12', text: 'text-zinc-400', size: 'text-xs', weight: 'font-normal', bullet: '' },
};

function getLevelStyle(level: number) {
  return LEVEL_STYLES[level] ?? LEVEL_STYLES[3];
}

function entriesToMarkdown(entries: TOCEntry[]): string {
  return entries.map((entry) => {
    const indent = '  '.repeat(entry.level - 1);
    const prefix = entry.level === 1 ? '#' : entry.level === 2 ? '##' : '###';
    const summaryPart = entry.summary ? ` - ${entry.summary}` : '';
    return `${indent}${prefix} ${entry.title}${summaryPart}`;
  }).join('\n');
}

export function TOCViewer({ entries, onClose, onEntryClick }: TOCViewerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const handleEntryClick = useCallback((entry: TOCEntry) => {
    setActiveId(entry.id);
    onEntryClick?.(entry);
  }, [onEntryClick]);

  const toggleSummary = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSummaries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      const md = entriesToMarkdown(entries);
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  }, [entries]);

  // Numbering counters per level
  const numbering = { 1: 0, 2: 0, 3: 0 };

  return (
    <div className="w-[400px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-medium text-white">Table of Contents</h3>
          <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium">
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopyMarkdown}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-md transition-all duration-200"
          >
            {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Entries */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {entries.map((entry) => {
            const style = getLevelStyle(entry.level);
            const isActive = activeId === entry.id;
            const hasSummary = !!entry.summary;
            const isSummaryExpanded = expandedSummaries.has(entry.id);

            // Track numbering
            const level = entry.level as 1 | 2 | 3;
            numbering[level]++;
            if (level === 1) { numbering[2] = 0; numbering[3] = 0; }
            if (level === 2) { numbering[3] = 0; }

            const number = level === 1
              ? `${numbering[1]}`
              : level === 2
                ? `${numbering[1]}.${numbering[2]}`
                : `${numbering[1]}.${numbering[2]}.${numbering[3]}`;

            return (
              <div key={entry.id}>
                <button
                  onClick={() => handleEntryClick(entry)}
                  className={`
                    w-full text-left px-4 py-2 flex items-start gap-2 transition-all duration-150
                    hover:bg-zinc-800/50
                    ${isActive ? 'bg-zinc-800/30 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}
                    ${style.margin}
                  `}
                >
                  <span className={`shrink-0 text-zinc-600 ${style.size} mt-px tabular-nums`}>
                    {number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`${style.text} ${style.size} ${style.weight} leading-relaxed`}>
                      {entry.title}
                    </span>
                    {hasSummary && (
                      <button
                        onClick={(e) => toggleSummary(entry.id, e)}
                        className="ml-1.5 inline-flex items-center text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        <ChevronRight className={`size-3 transition-transform duration-150 ${isSummaryExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                    {hasSummary && isSummaryExpanded && (
                      <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">
                        {entry.summary}
                      </p>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 text-center">
          Click an entry to navigate
        </p>
      </div>
    </div>
  );
}
