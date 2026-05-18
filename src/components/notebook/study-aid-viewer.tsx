'use client';

import { useState } from 'react';
import {
  X,
  HelpCircle,
  BookOpen,
  Clock,
  FileBarChart,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const TYPE_CONFIG = {
  faq: { icon: HelpCircle, label: 'FAQ', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'study-guide': { icon: BookOpen, label: 'Study Guide', color: 'text-green-400', bg: 'bg-green-500/10' },
  timeline: { icon: Clock, label: 'Timeline', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  briefing: { icon: FileBarChart, label: 'Briefing', color: 'text-purple-400', bg: 'bg-purple-500/10' },
} as const;

interface StudyAidViewerProps {
  type: 'faq' | 'study-guide' | 'timeline' | 'briefing';
  content: string;
  onClose: () => void;
}

function renderMarkdownLike(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="my-3 bg-zinc-900 rounded-lg px-3 py-3 overflow-x-auto">
            <code className="text-xs text-zinc-300 font-mono">{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    if (!trimmed) {
      elements.push(<div key={i} className="h-2.5" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-white mt-4 mb-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>,
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-[15px] font-semibold text-white mt-5 mb-1.5">
          {renderInline(trimmed.slice(3))}
        </h3>,
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-white mt-5 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>,
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mb-0.5">
          <span className="text-zinc-600 mt-0.5 shrink-0 text-[10px]">&#9679;</span>
          <span className="text-[13px] text-zinc-300 leading-relaxed">
            {renderInline(trimmed.slice(2))}
          </span>
        </div>,
      );
      return;
    }

    // Numbered lists
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mb-0.5">
          <span className="text-zinc-500 text-xs shrink-0 w-4 text-right font-medium">
            {numberedMatch[1]}.
          </span>
          <span className="text-[13px] text-zinc-300 leading-relaxed">
            {renderInline(numberedMatch[2])}
          </span>
        </div>,
      );
      return;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(
        <hr key={i} className="border-zinc-800/60 my-4" />,
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-[13px] text-zinc-300 leading-relaxed mb-1.5">
        {renderInline(trimmed)}
      </p>,
    );
  });

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Bold, italic, inline code
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">{match[2]}</strong>
      );
    } else if (match[4]) {
      parts.push(
        <em key={match.index} className="italic text-zinc-200">{match[4]}</em>
      );
    } else if (match[6]) {
      parts.push(
        <code key={match.index} className="px-1 py-0.5 rounded bg-zinc-800 text-blue-300 text-[0.85em] font-mono">
          {match[6]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export function StudyAidViewer({ type, content, onClose }: StudyAidViewerProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  }

  return (
    <div className="w-[380px] shrink-0 bg-zinc-900/50 border-l border-zinc-800/60 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className={`size-7 rounded-lg ${config.bg} flex items-center justify-center`}>
            <Icon className={`size-3.5 ${config.color}`} />
          </div>
          <h3 className="text-sm font-medium text-white">{config.label}</h3>
        </div>
        <div className="flex items-center gap-0.5">
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

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {renderMarkdownLike(content)}
        </div>
      </ScrollArea>
    </div>
  );
}
