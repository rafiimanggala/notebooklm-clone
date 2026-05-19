'use client';

import { useMemo } from 'react';
import {
  X,
  Mic,
  GitBranch,
  BookOpen,
  FileText,
  HelpCircle,
  Layers,
  CircleHelp,
  Clock,
  Table,
  List,
  Presentation,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudioPanelProps {
  onOutputRequest: (type: string) => void;
  onAudioRequest: () => void;
  onClose: () => void;
  loading?: string | null;
  generatedItems?: Array<{ type: string; createdAt: number }>;
}

const OUTPUT_TYPES = [
  { type: 'mind-map', label: 'Mind Map', icon: GitBranch, color: '#129EAF' },
  { type: 'study-guide', label: 'Study Guide', icon: BookOpen, color: '#34A853' },
  { type: 'briefing', label: 'Briefing Doc', icon: FileText, color: '#4285F4' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, color: '#FA903E' },
  { type: 'flashcard', label: 'Flashcards', icon: Layers, color: '#7CB342' },
  { type: 'quiz', label: 'Quiz', icon: CircleHelp, color: '#9334E6' },
  { type: 'timeline', label: 'Timeline', icon: Clock, color: '#5F6368' },
  { type: 'data-table', label: 'Data Table', icon: Table, color: '#1A73E8' },
  { type: 'toc', label: 'TOC', icon: List, color: '#137333' },
  { type: 'slides', label: 'Slides', icon: Presentation, color: '#EA4335' },
] as const;

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getOutputConfig(type: string) {
  return OUTPUT_TYPES.find((o) => o.type === type);
}

export function StudioPanel({
  onOutputRequest,
  onAudioRequest,
  onClose,
  loading = null,
  generatedItems = [],
}: StudioPanelProps) {
  const sortedGenerated = useMemo(() => {
    return [...generatedItems].sort((a, b) => b.createdAt - a.createdAt);
  }, [generatedItems]);

  return (
    <div className="w-[320px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--outline)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)] font-[family-name:var(--font-heading)]">Studio</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container-high)]"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Audio Overview — special prominent card */}
          <button
            onClick={onAudioRequest}
            disabled={loading === 'audio'}
            className="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-4 flex items-center gap-3 hover:shadow-[var(--shadow-1)] hover:border-[var(--nlm-primary)] transition-all duration-200 disabled:opacity-50 group cursor-pointer"
          >
            <div className="size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors" style={{ backgroundColor: '#A142F415' }}>
              {loading === 'audio' ? (
                <Loader2 className="size-5 animate-spin" style={{ color: '#A142F4' }} />
              ) : (
                <Mic className="size-5" style={{ color: '#A142F4' }} />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">Audio Overview</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Generate a podcast-style discussion</p>
            </div>
          </button>

          {/* Output type grid */}
          <div>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-3">
              Generate
            </p>
            <div className="grid grid-cols-2 gap-2">
              {OUTPUT_TYPES.map(({ type, label, icon: Icon, color }) => {
                const isLoading = loading === type;
                return (
                  <button
                    key={type}
                    onClick={() => onOutputRequest(type)}
                    disabled={isLoading}
                    className="relative rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-3 flex flex-col items-start gap-2 hover:shadow-[var(--shadow-1)] transition-all duration-200 disabled:opacity-50 group cursor-pointer"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${color}08`;
                      e.currentTarget.style.borderColor = `${color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.borderColor = '';
                    }}
                  >
                    {isLoading ? (
                      <Loader2 className="size-5 animate-spin" style={{ color }} />
                    ) : (
                      <Icon className="size-5" style={{ color }} />
                    )}
                    <span className="text-[13px] font-medium text-[var(--text-primary)] transition-colors">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated content list */}
          {sortedGenerated.length > 0 && (
            <div>
              <div className="h-px bg-[var(--outline)] mb-4" />
              <p className="text-[11px] text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-3">
                Generated
              </p>
              <div className="space-y-1.5">
                {sortedGenerated.map((item, i) => {
                  const config = getOutputConfig(item.type);
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                    <button
                      key={`${item.type}-${item.createdAt}-${i}`}
                      onClick={() => onOutputRequest(item.type)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--surface-container-high)] transition-colors group cursor-pointer"
                    >
                      <Icon className="size-4 shrink-0" style={{ color: config.color }} />
                      <span className="text-xs text-[var(--text-primary)] flex-1 text-left">
                        {config.label}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] tabular-nums">
                        {timeAgo(item.createdAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
