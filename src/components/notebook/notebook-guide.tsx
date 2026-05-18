'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Search,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Clock,
  FileBarChart,
  MessageSquare,
  Layers,
  RefreshCw,
  FileQuestion,
  GraduationCap,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { Source, NotebookGuide as NotebookGuideType } from '@/types';

interface NotebookGuideProps {
  notebookId: string;
  sources: Source[];
  onQuestionSelect: (question: string) => void;
  onStudyAidRequest: (type: string) => void;
}

const QUESTION_ICONS = [Search, Lightbulb, HelpCircle, MessageSquare, Layers, FileQuestion];

const STUDY_TOOLS = [
  {
    type: 'faq',
    icon: HelpCircle,
    label: 'FAQ',
    description: 'Common questions & answers',
    color: 'text-blue-400',
  },
  {
    type: 'study-guide',
    icon: BookOpen,
    label: 'Study Guide',
    description: 'Structured learning outline',
    color: 'text-green-400',
  },
  {
    type: 'timeline',
    icon: Clock,
    label: 'Timeline',
    description: 'Chronological events',
    color: 'text-amber-400',
  },
  {
    type: 'briefing',
    icon: FileBarChart,
    label: 'Briefing',
    description: 'Executive summary',
    color: 'text-purple-400',
  },
  {
    type: 'flashcard',
    icon: GraduationCap,
    label: 'Flashcards',
    description: 'Test your knowledge',
    color: 'text-pink-400',
  },
  {
    type: 'quiz',
    icon: FileQuestion,
    label: 'Quiz',
    description: 'Interactive assessment',
    color: 'text-cyan-400',
  },
] as const;

function GuideSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48 bg-zinc-800" />
        <Skeleton className="h-4 w-32 bg-zinc-800" />
      </div>
      {/* Summary skeleton */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 space-y-3">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <Skeleton className="h-4 w-full bg-zinc-800" />
        <Skeleton className="h-4 w-full bg-zinc-800" />
        <Skeleton className="h-4 w-3/4 bg-zinc-800" />
      </div>
      {/* Topics skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 bg-zinc-800" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full bg-zinc-800" />
          ))}
        </div>
      </div>
      {/* Questions skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotebookGuide({
  notebookId,
  sources,
  onQuestionSelect,
  onStudyAidRequest,
}: NotebookGuideProps) {
  const [guide, setGuide] = useState<NotebookGuideType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabledSources = sources.filter((s) => s.enabled !== false);

  const fetchGuide = useCallback(async () => {
    if (enabledSources.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/guide`);
      if (!res.ok) throw new Error('Failed to fetch guide');
      const data = await res.json();
      setGuide(data);
    } catch {
      setError('Unable to generate guide');
    } finally {
      setLoading(false);
    }
  }, [notebookId, enabledSources.length]);

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  // No sources state
  if (enabledSources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Plus className="size-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No sources yet</h3>
          <p className="text-sm text-zinc-500">
            Add sources to generate a notebook guide
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <ScrollArea className="flex-1">
        <GuideSkeleton />
      </ScrollArea>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="size-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">{error}</h3>
          <p className="text-sm text-zinc-500 mb-4">
            There was a problem analyzing your sources
          </p>
          <Button
            onClick={fetchGuide}
            className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
          >
            <RefreshCw className="size-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!guide) return null;

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Sparkles className="size-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Notebook Guide</h2>
          </div>
          <p className="text-xs text-zinc-500">
            {enabledSources.length} source{enabledSources.length !== 1 ? 's' : ''} analyzed
          </p>
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Overview
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
            {guide.summary}
          </p>
        </div>

        {/* Key Topics */}
        {guide.keyTopics.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Key Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {guide.keyTopics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => onQuestionSelect(`Tell me about ${topic}`)}
                  className="inline-flex items-center h-7 px-3 rounded-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-blue-500 hover:text-blue-400 transition-all duration-200 cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Questions */}
        {guide.suggestedQuestions.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Start Exploring
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guide.suggestedQuestions.map((question, i) => {
                const Icon = QUESTION_ICONS[i % QUESTION_ICONS.length];
                return (
                  <button
                    key={i}
                    onClick={() => onQuestionSelect(question)}
                    className="group flex items-start gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 text-left cursor-pointer"
                  >
                    <Icon className="size-4 text-zinc-500 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors duration-200" />
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200 line-clamp-3">
                      {question}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Study Tools */}
        <div>
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Study Tools
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STUDY_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.type}
                  onClick={() => onStudyAidRequest(tool.type)}
                  className="group flex flex-col items-start gap-2 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 text-left cursor-pointer"
                >
                  <Icon className={`size-5 ${tool.color} transition-colors duration-200`} />
                  <div>
                    <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors duration-200">
                      {tool.label}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
