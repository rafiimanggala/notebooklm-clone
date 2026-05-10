'use client';

import { useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Globe,
  Video,
  AlignLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Source, SourceType } from '@/types';

const SOURCE_ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  url: Globe,
  youtube: Video,
  text: AlignLeft,
};

const SOURCE_LABELS: Record<SourceType, string> = {
  pdf: 'PDF',
  url: 'Website',
  youtube: 'YouTube',
  text: 'Text',
};

interface SourceViewerProps {
  source: Source;
  highlightText?: string;
  onClose: () => void;
}

export function SourceViewer({ source, highlightText, onClose }: SourceViewerProps) {
  const highlightRef = useRef<HTMLSpanElement>(null);
  const Icon = SOURCE_ICONS[source.type as SourceType] ?? FileText;

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightText]);

  const metadata = useMemo(() => {
    try {
      return JSON.parse(source.metadata);
    } catch {
      return {};
    }
  }, [source.metadata]);

  function renderContent() {
    if (!highlightText || !source.content.includes(highlightText)) {
      return (
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {source.content}
        </p>
      );
    }

    const parts = source.content.split(highlightText);
    const elements: React.ReactNode[] = [];

    parts.forEach((part, i) => {
      elements.push(
        <span key={`part-${i}`}>{part}</span>,
      );
      if (i < parts.length - 1) {
        elements.push(
          <span
            key={`highlight-${i}`}
            ref={i === 0 ? highlightRef : undefined}
            className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded"
          >
            {highlightText}
          </span>,
        );
      }
    });

    return (
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
        {elements}
      </p>
    );
  }

  return (
    <div className="w-[350px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-start justify-between border-b border-zinc-800">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Icon className="size-5 text-zinc-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{source.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-zinc-700 text-zinc-300 hover:bg-zinc-700 text-[10px]">
                {SOURCE_LABELS[source.type as SourceType] ?? source.type}
              </Badge>
              {source.fileSize && (
                <span className="text-[10px] text-zinc-500">
                  {(source.fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Metadata */}
      {metadata.url && (
        <div className="px-4 py-2 border-b border-zinc-800">
          <a
            href={metadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 truncate block"
          >
            {metadata.url}
          </a>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
}
