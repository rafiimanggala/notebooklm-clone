'use client';

import { MessageSquare } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  {
    text: 'What are the main topics covered in my sources?',
    icon: '📋',
  },
  {
    text: 'Can you summarize the key findings?',
    icon: '🔍',
  },
  {
    text: 'What are the most important takeaways?',
    icon: '💡',
  },
  {
    text: 'Are there any conflicting viewpoints across sources?',
    icon: '⚖️',
  },
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
      {SUGGESTED_QUESTIONS.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q.text)}
          className="group flex items-start gap-3 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors text-left cursor-pointer"
        >
          <MessageSquare className="size-4 text-zinc-500 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
          <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
            {q.text}
          </span>
        </button>
      ))}
    </div>
  );
}
