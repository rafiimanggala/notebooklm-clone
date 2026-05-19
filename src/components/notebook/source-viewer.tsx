'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import {
  FileText,
  Globe,
  Video,
  AlignLeft,
  Hash,
  Table,
  FileType,
  X,
  Copy,
  Check,
  ExternalLink,
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
  markdown: Hash,
  csv: Table,
  docx: FileType,
};

const SOURCE_LABELS: Record<SourceType, string> = {
  pdf: 'PDF',
  url: 'Website',
  youtube: 'YouTube',
  text: 'Text',
  markdown: 'Markdown',
  csv: 'CSV',
  docx: 'DOCX',
};

interface SourceViewerProps {
  source: Source;
  highlightText?: string;
  onClose: () => void;
}

export function SourceViewer({ source, highlightText, onClose }: SourceViewerProps) {
  const highlightRef = useRef<HTMLSpanElement>(null);
  const Icon = SOURCE_ICONS[source.type as SourceType] ?? FileText;
  const [copied, setCopied] = useState(false);

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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(source.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  }

  function renderContent() {
    if (!highlightText || !source.content.includes(highlightText)) {
      return (
        <p className="text-[13px] text-zinc-300 leading-[1.7] whitespace-pre-wrap">
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
            className="bg-yellow-500/20 text-yellow-200 px-0.5 rounded-sm border-b border-yellow-500/30"
          >
            {highlightText}
          </span>,
        );
      }
    });

    return (
      <p className="text-[13px] text-zinc-300 leading-[1.7] whitespace-pre-wrap">
        {elements}
      </p>
    );
  }

  return (
    <div className="w-[380px] shrink-0 bg-zinc-900/50 border-l border-zinc-800/60 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-start justify-between border-b border-zinc-800/60">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-9 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0">
            <Icon className="size-4 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{source.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-zinc-800/80 text-zinc-500 hover:bg-zinc-800/80 text-[10px] border-none h-4 px-1.5">
                {SOURCE_LABELS[source.type as SourceType] ?? source.type}
              </Badge>
              {source.fileSize && (
                <span className="text-[10px] text-zinc-600">
                  {(source.fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-md transition-all duration-200"
          >
            {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-md transition-all duration-200"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Metadata */}
      {metadata.url && (
        <div className="px-4 py-2 border-b border-zinc-800/60">
          <a
            href={metadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-400 hover:text-blue-300 truncate flex items-center gap-1.5 transition-colors duration-200"
          >
            <ExternalLink className="size-3 shrink-0" />
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
