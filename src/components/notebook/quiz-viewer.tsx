'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Check,
  XIcon,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { QuizQuestion } from '@/types';

interface QuizViewerProps {
  questions: QuizQuestion[];
  onClose: () => void;
}

type AnswerState = 'unanswered' | 'selected' | 'correct' | 'wrong';

interface QuestionResult {
  selectedIndex: number;
  isCorrect: boolean;
}

function getPerformanceMessage(correct: number, total: number): { text: string; color: string } {
  const ratio = correct / total;
  if (ratio === 1) return { text: 'Perfect!', color: 'text-green-400' };
  if (ratio >= 0.7) return { text: 'Great job!', color: 'text-blue-400' };
  if (ratio >= 0.4) return { text: 'Keep studying', color: 'text-amber-400' };
  return { text: 'Review the material', color: 'text-red-400' };
}

export function QuizViewer({ questions, onClose }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  const [showSummary, setShowSummary] = useState(false);

  const total = questions.length;
  const current = questions[currentIndex];
  const correctCount = Object.values(results).filter((r) => r.isCorrect).length;
  const wrongCount = Object.values(results).filter((r) => !r.isCorrect).length;

  const checkAnswer = useCallback(() => {
    if (selectedOption === null || !current) return;
    const isCorrect = selectedOption === current.correctIndex;
    setResults((prev) => ({
      ...prev,
      [current.id]: { selectedIndex: selectedOption, isCorrect },
    }));
    setIsChecked(true);
  }, [selectedOption, current]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsChecked(false);
    } else {
      setShowSummary(true);
    }
  }, [currentIndex, total]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsChecked(false);
    setResults({});
    setShowSummary(false);
  }, []);

  const getOptionState = (optionIndex: number): AnswerState => {
    if (!isChecked) {
      return selectedOption === optionIndex ? 'selected' : 'unanswered';
    }
    if (optionIndex === current?.correctIndex) return 'correct';
    if (optionIndex === selectedOption) return 'wrong';
    return 'unanswered';
  };

  const optionStyles: Record<AnswerState, string> = {
    unanswered: 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300',
    selected: 'border-blue-500 bg-blue-500/10 text-white',
    correct: 'border-green-500 bg-green-500/10 text-green-300',
    wrong: 'border-red-500 bg-red-500/10 text-red-300',
  };

  if (!current && !showSummary) return null;

  // Circular progress for summary
  const scorePercent = total > 0 ? (correctCount / total) * 100 : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;
  const performance = getPerformanceMessage(correctCount, total);

  return (
    <div className="w-[400px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-medium text-white">Quiz</h3>
          <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium">
            {total} questions
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

      {/* Segmented progress bar */}
      {!showSummary && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex gap-1">
            {questions.map((q, i) => {
              const result = results[q.id];
              let color = 'bg-zinc-800';
              if (result) {
                color = result.isCorrect ? 'bg-green-500' : 'bg-red-500';
              } else if (i === currentIndex) {
                color = 'bg-zinc-600';
              }
              return (
                <div
                  key={q.id}
                  className={`flex-1 h-1 rounded-full transition-all duration-200 ${color}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {showSummary ? (
        /* Final Score Screen */
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center justify-center p-8 min-h-[500px]">
            {/* Circular progress */}
            <div className="relative w-28 h-28 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-zinc-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={scorePercent === 100 ? 'text-green-400' : scorePercent >= 70 ? 'text-blue-400' : scorePercent >= 40 ? 'text-amber-400' : 'text-red-400'}
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset,
                    transition: 'stroke-dashoffset 0.8s ease-out',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {correctCount}/{total}
                </span>
              </div>
            </div>

            <p className={`text-lg font-semibold mb-1 ${performance.color}`}>
              {performance.text}
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              {Math.round(scorePercent)}% correct
            </p>

            <div className="w-full max-w-[260px] space-y-3 mb-8">
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-green-400" />
                  <span className="text-sm text-green-400">Correct</span>
                </div>
                <span className="text-sm font-medium text-green-400">{correctCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-2">
                  <XIcon className="size-4 text-red-400" />
                  <span className="text-sm text-red-400">Wrong</span>
                </div>
                <span className="text-sm font-medium text-red-400">{wrongCount}</span>
              </div>
            </div>

            <Button
              onClick={restart}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            >
              <RotateCcw className="size-4 mr-2" />
              Try Again
            </Button>
          </div>
        </ScrollArea>
      ) : (
        <>
          {/* Question */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Question header */}
              <div>
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Question {currentIndex + 1} of {total}
                </span>
                <p className="text-sm text-white mt-2 leading-relaxed">
                  {current!.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {current!.options.map((option, i) => {
                  const state = getOptionState(i);
                  const isDisabled = isChecked;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!isDisabled) setSelectedOption(i);
                      }}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${optionStyles[state]} ${
                        isDisabled ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                        state === 'selected'
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : state === 'correct'
                            ? 'border-green-500 bg-green-500 text-white'
                            : state === 'wrong'
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-zinc-600 text-zinc-500'
                      }`}>
                        {state === 'correct' ? (
                          <Check className="size-3.5" />
                        ) : state === 'wrong' ? (
                          <XIcon className="size-3.5" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )}
                      </span>
                      <span className="text-sm flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {isChecked && current!.explanation && (
                <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 mt-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-400 mb-1">Explanation</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {current!.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Bottom action */}
          <div className="p-4 border-t border-zinc-800">
            {!isChecked ? (
              <Button
                onClick={checkAnswer}
                disabled={selectedOption === null}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg h-9 disabled:opacity-30"
              >
                Check Answer
              </Button>
            ) : (
              <Button
                onClick={goNext}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg h-9 border border-zinc-700"
              >
                {currentIndex < total - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="size-4 ml-1" />
                  </>
                ) : (
                  <>
                    See Results
                    <Trophy className="size-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
