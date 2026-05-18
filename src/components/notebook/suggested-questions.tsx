'use client';

import { FileText, Lightbulb, ListChecks, HelpCircle } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  {
    text: 'What are the main topics covered in my sources?',
    icon: FileText,
  },
  {
    text: 'Can you summarize the key findings?',
    icon: Lightbulb,
  },
  {
    text: 'What are the most important takeaways?',
    icon: ListChecks,
  },
  {
    text: 'Are there any conflicting viewpoints across sources?',
    icon: HelpCircle,
  },
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
      {SUGGESTED_QUESTIONS.map((q, i) => {
        const Icon = q.icon;
        return (
          <button
            key={i}
            onClick={() => onSelect(q.text)}
            className="group flex items-start gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/60 hover:bg-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 text-left cursor-pointer"
          >
            <div className="size-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 transition-colors duration-200">
              <Icon className="size-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors duration-200" />
            </div>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200 leading-relaxed">
              {q.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
