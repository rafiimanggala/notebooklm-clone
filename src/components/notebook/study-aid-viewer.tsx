'use client';

import {
  X,
  HelpCircle,
  BookOpen,
  Clock,
  FileBarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const TYPE_CONFIG = {
  faq: { icon: HelpCircle, label: 'FAQ', color: 'text-blue-400' },
  'study-guide': { icon: BookOpen, label: 'Study Guide', color: 'text-green-400' },
  timeline: { icon: Clock, label: 'Timeline', color: 'text-amber-400' },
  briefing: { icon: FileBarChart, label: 'Briefing', color: 'text-purple-400' },
} as const;

interface StudyAidViewerProps {
  type: 'faq' | 'study-guide' | 'timeline' | 'briefing';
  content: string;
  onClose: () => void;
}

function renderMarkdownLike(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={i} className="h-3" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-base font-semibold text-white mt-4 mb-2">
          {renderInline(trimmed.slice(4))}
        </h4>,
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-white mt-5 mb-2">
          {renderInline(trimmed.slice(3))}
        </h3>,
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3">
          {renderInline(trimmed.slice(2))}
        </h2>,
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2 mb-1">
          <span className="text-zinc-500 mt-0.5 shrink-0">&#x2022;</span>
          <span className="text-sm text-zinc-300 leading-relaxed">
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
        <div key={i} className="flex gap-2 ml-2 mb-1">
          <span className="text-zinc-500 text-sm shrink-0 w-5 text-right">
            {numberedMatch[1]}.
          </span>
          <span className="text-sm text-zinc-300 leading-relaxed">
            {renderInline(numberedMatch[2])}
          </span>
        </div>,
      );
      return;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(
        <hr key={i} className="border-zinc-700 my-4" />,
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-zinc-300 leading-relaxed mb-2">
        {renderInline(trimmed)}
      </p>,
    );
  });

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-white">
        {match[1]}
      </strong>,
    );
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

  return (
    <div className="w-[350px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <Icon className={`size-5 ${config.color}`} />
          <h3 className="text-sm font-medium text-white">{config.label}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <X className="size-4" />
        </Button>
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
