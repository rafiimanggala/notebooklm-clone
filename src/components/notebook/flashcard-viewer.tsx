'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Flashcard } from '@/types';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<Flashcard['difficulty'], { bg: string; text: string; label: string }> = {
  easy: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Easy' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Medium' },
  hard: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Hard' },
};

export function FlashcardViewer({ flashcards, onClose }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, 'got-it' | 'review'>>({});
  const [showSummary, setShowSummary] = useState(false);

  const total = flashcards.length;
  const current = flashcards[currentIndex];
  const reviewedCount = Object.keys(results).length;
  const gotItCount = Object.values(results).filter((r) => r === 'got-it').length;
  const reviewCount = Object.values(results).filter((r) => r === 'review').length;
  const allReviewed = reviewedCount === total;

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    } else if (allReviewed) {
      setShowSummary(true);
    }
  }, [currentIndex, total, allReviewed]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const flip = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const markCard = useCallback(
    (result: 'got-it' | 'review') => {
      if (!current) return;
      setResults((prev) => ({ ...prev, [current.id]: result }));
      // Auto-advance after marking
      if (currentIndex < total - 1) {
        setTimeout(() => {
          setCurrentIndex((i) => i + 1);
          setIsFlipped(false);
        }, 200);
      } else {
        // Last card marked, show summary
        setTimeout(() => setShowSummary(true), 200);
      }
    },
    [current, currentIndex, total],
  );

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults({});
    setShowSummary(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === ' ') {
        e.preventDefault();
        flip();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, flip]);

  if (!current && !showSummary) return null;

  const difficulty = current ? DIFFICULTY_COLORS[current.difficulty] : null;
  const progressPercent = total > 0 ? (reviewedCount / total) * 100 : 0;

  return (
    <div className="w-[400px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-medium text-white">Flashcards</h3>
          <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium">
            {total}
          </span>
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

      {showSummary ? (
        /* Summary Screen */
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
              <Trophy className="size-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Session Complete</h3>
            <p className="text-sm text-zinc-400 mb-8">
              You reviewed all {total} flashcards
            </p>

            <div className="w-full max-w-[280px] space-y-3 mb-8">
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-green-400" />
                  <span className="text-sm text-green-400">Got it</span>
                </div>
                <span className="text-sm font-medium text-green-400">{gotItCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2">
                  <RotateCcw className="size-4 text-amber-400" />
                  <span className="text-sm text-amber-400">Review again</span>
                </div>
                <span className="text-sm font-medium text-amber-400">{reviewCount}</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-2xl font-bold text-white">
                {Math.round((gotItCount / total) * 100)}%
              </p>
              <p className="text-xs text-zinc-500 mt-1">mastery rate</p>
            </div>

            <Button
              onClick={restart}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            >
              <RotateCcw className="size-4 mr-2" />
              Study Again
            </Button>
          </div>
        </ScrollArea>
      ) : (
        <>
          {/* Progress */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">
                {currentIndex + 1} of {total}
              </span>
              <span className="text-xs text-zinc-500">
                {reviewedCount} reviewed
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Card */}
          <div className="flex-1 flex items-center justify-center px-4 py-6">
            <div
              className="w-full cursor-pointer"
              style={{ perspective: '1000px' }}
              onClick={flip}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="w-full min-h-[240px] rounded-xl bg-zinc-850 border border-zinc-700 p-6 flex flex-col"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {difficulty && (
                    <span className={`self-end inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium ${difficulty.bg} ${difficulty.text}`}>
                      {difficulty.label}
                    </span>
                  )}
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-base text-white text-center leading-relaxed">
                      {current!.front}
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-600 text-center mt-4">
                    Click or press Space to flip
                  </p>
                </div>

                {/* Back */}
                <div
                  className="w-full min-h-[240px] rounded-xl bg-zinc-800 border border-zinc-600 p-6 flex flex-col absolute inset-0"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {difficulty && (
                    <span className={`self-end inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium ${difficulty.bg} ${difficulty.text}`}>
                      {difficulty.label}
                    </span>
                  )}
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-zinc-300 text-center leading-relaxed">
                      {current!.back}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions after flip */}
          {isFlipped && !results[current!.id] && (
            <div className="px-4 pb-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => markCard('review')}
                  variant="ghost"
                  className="flex-1 h-9 rounded-lg border border-zinc-700 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Review again
                </Button>
                <Button
                  onClick={() => markCard('got-it')}
                  variant="ghost"
                  className="flex-1 h-9 rounded-lg border border-zinc-700 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                >
                  <Check className="size-3.5 mr-1.5" />
                  Got it
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
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
            <div className="flex gap-1">
              {flashcards.map((fc, i) => (
                <div
                  key={fc.id}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i === currentIndex
                      ? 'bg-blue-500 w-3'
                      : results[fc.id] === 'got-it'
                        ? 'bg-green-500'
                        : results[fc.id] === 'review'
                          ? 'bg-amber-500'
                          : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={goNext}
              disabled={currentIndex === total - 1 && !allReviewed}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
            >
              {currentIndex === total - 1 && allReviewed ? 'Results' : 'Next'}
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
