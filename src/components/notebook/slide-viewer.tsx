'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SlideContent } from '@/types';

interface SlideViewerProps {
  slides: SlideContent[];
  onClose: () => void;
}

function renderSlideMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-zinc-200 mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>,
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-[15px] font-semibold text-zinc-100 mt-3 mb-1">
          {renderInline(trimmed.slice(3))}
        </h3>,
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-white mt-3 mb-1.5">
          {renderInline(trimmed.slice(2))}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mb-0.5">
          <span className="text-blue-400 mt-1 shrink-0 text-[8px]">&#9679;</span>
          <span className="text-sm text-zinc-300 leading-relaxed">
            {renderInline(trimmed.slice(2))}
          </span>
        </div>,
      );
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1 mb-0.5">
          <span className="text-blue-400 text-sm shrink-0 w-5 text-right font-medium">
            {numberedMatch[1]}.
          </span>
          <span className="text-sm text-zinc-300 leading-relaxed">
            {renderInline(numberedMatch[2])}
          </span>
        </div>,
      );
      return;
    }

    elements.push(
      <p key={i} className="text-sm text-zinc-300 leading-relaxed mb-1">
        {renderInline(trimmed)}
      </p>,
    );
  });

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index} className="italic text-zinc-200">{match[4]}</em>);
    } else if (match[6]) {
      parts.push(
        <code key={match.index} className="px-1 py-0.5 rounded bg-zinc-700 text-blue-300 text-[0.85em] font-mono">
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

function slidesToMarkdown(slides: SlideContent[]): string {
  return slides.map((slide, i) => {
    let md = `---\n## Slide ${i + 1}: ${slide.title}\n\n${slide.content}`;
    if (slide.notes) {
      md += `\n\n> Notes: ${slide.notes}`;
    }
    return md;
  }).join('\n\n');
}

export function SlideViewer({ slides, onClose }: SlideViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = slides.length;
  const current = slides[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, isFullscreen]);

  const handleCopy = useCallback(async () => {
    try {
      const md = slidesToMarkdown(slides);
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available
    }
  }, [slides]);

  if (!current) return null;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-[500px]'} shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-medium text-white">Slides</h3>
          <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium">
            {total}
          </span>
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
            onClick={() => setIsFullscreen((f) => !f)}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-md transition-all duration-200"
          >
            {isFullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
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

      {/* Slide display */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Slide card */}
          <div
            className="relative rounded-xl overflow-hidden border border-zinc-800"
            style={{ aspectRatio: '16 / 9' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
            <div className="relative h-full flex flex-col p-6">
              <h2 className="text-xl font-semibold text-white mb-4 shrink-0">
                {current.title}
              </h2>
              <div className="flex-1 overflow-y-auto">
                {renderSlideMarkdown(current.content)}
              </div>
              <div className="shrink-0 mt-3 text-right">
                <span className="text-[10px] text-zinc-600 tabular-nums">
                  {currentIndex + 1} / {total}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>
            <span className="text-xs text-zinc-500 tabular-nums">
              {currentIndex + 1} of {total}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              disabled={currentIndex === total - 1}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>

          {/* Speaker notes */}
          {current.notes && (
            <div>
              <button
                onClick={() => setShowNotes((n) => !n)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <StickyNote className="size-3" />
                Speaker Notes
                <ChevronRight className={`size-3 transition-transform duration-150 ${showNotes ? 'rotate-90' : ''}`} />
              </button>
              {showNotes && (
                <div className="mt-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <p className="text-xs text-zinc-400 leading-relaxed">{current.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail strip */}
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-600 mb-2">All Slides</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`
                    shrink-0 w-24 rounded-lg border p-2 transition-all duration-150
                    ${i === currentIndex
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 hover:bg-zinc-800/60'
                    }
                  `}
                >
                  <div style={{ aspectRatio: '16 / 9' }} className="flex flex-col justify-start">
                    <p className="text-[8px] font-medium text-white truncate leading-tight">
                      {slide.title}
                    </p>
                    <p className="text-[7px] text-zinc-500 truncate mt-0.5">
                      {slide.content.slice(0, 40)}
                    </p>
                  </div>
                  <span className="text-[8px] text-zinc-600 mt-1 block">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
