'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, FileText, Lightbulb, ListChecks, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Citation, Source } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface ChatPanelProps {
  notebookId: string;
  initialMessages: ChatMessage[];
  onCitationClick: (citation: Citation) => void;
  hasSources: boolean;
  enabledSourceIds?: Set<string>;
}

function CitationBadge({
  index,
  citation,
  onClick,
}: {
  index: number;
  citation?: Citation;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={citation?.text?.slice(0, 100) || `Source ${index}`}
      className="inline-flex items-center justify-center min-w-[1.25rem] h-[1.125rem] px-1 mx-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 transition-all duration-200 cursor-pointer align-text-top"
    >
      {index}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2.5">
        <div className="size-7 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="size-3 text-blue-400" />
        </div>
        <div className="bg-zinc-800/40 rounded-2xl rounded-tl-md px-4 py-3">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-1.5 rounded-full bg-zinc-500"
                style={{
                  animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMarkdownInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Process bold, italic, inline code
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

function renderMessageContent(
  content: string,
  citations: Citation[],
  onCitationClick: (citation: Citation) => void,
) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  lines.forEach((line, lineIdx) => {
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${lineIdx}`} className="my-3 rounded-lg overflow-hidden">
            {codeBlockLang && (
              <div className="bg-zinc-800 px-3 py-1.5 text-[10px] text-zinc-500 font-mono border-b border-zinc-700/50">
                {codeBlockLang}
              </div>
            )}
            <pre className="bg-zinc-900 px-3 py-3 overflow-x-auto">
              <code className="text-xs text-zinc-300 font-mono">{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`blank-${lineIdx}`} className="h-2" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={lineIdx} className="text-sm font-semibold text-white mt-3 mb-1.5">
          {renderMarkdownInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={lineIdx} className="text-[15px] font-semibold text-white mt-4 mb-1.5">
          {renderMarkdownInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={lineIdx} className="flex gap-2 ml-1 mb-0.5">
          <span className="text-zinc-600 mt-0.5 shrink-0 text-[10px]">&#9679;</span>
          <span className="text-[13px] text-zinc-300 leading-relaxed">
            {renderLineWithCitations(trimmed.slice(2), citations, onCitationClick)}
          </span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={lineIdx} className="flex gap-2 ml-1 mb-0.5">
          <span className="text-zinc-500 text-xs shrink-0 w-4 text-right font-medium">
            {numberedMatch[1]}.
          </span>
          <span className="text-[13px] text-zinc-300 leading-relaxed">
            {renderLineWithCitations(numberedMatch[2], citations, onCitationClick)}
          </span>
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={lineIdx} className="text-[13px] text-zinc-300 leading-relaxed mb-1">
        {renderLineWithCitations(trimmed, citations, onCitationClick)}
      </p>
    );
  });

  return elements;
}

function renderLineWithCitations(
  text: string,
  citations: Citation[],
  onCitationClick: (citation: Citation) => void,
) {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>{renderMarkdownInline(text.slice(lastIndex, match.index))}</span>
      );
    }

    const citationIndex = parseInt(match[1], 10);
    const citation = citations[citationIndex - 1];

    parts.push(
      <CitationBadge
        key={`c-${match.index}`}
        index={citationIndex}
        citation={citation}
        onClick={() => {
          if (citation) onCitationClick(citation);
        }}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`t-${lastIndex}`}>{renderMarkdownInline(text.slice(lastIndex))}</span>
    );
  }

  return parts;
}

const SUGGESTED_QUESTIONS = [
  { text: 'What are the main topics covered?', icon: FileText },
  { text: 'Summarize the key findings', icon: Lightbulb },
  { text: 'What are the important takeaways?', icon: ListChecks },
  { text: 'Any conflicting viewpoints?', icon: HelpCircle },
];

export function ChatPanel({
  notebookId,
  initialMessages,
  onCitationClick,
  hasSources,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSubmit(messageText?: string) {
    const text = messageText ?? input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      citations: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        citations: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: assistantContent,
            };
          }
          return updated;
        });

        scrollToBottom();
      }

      // Fetch messages to get citations
      try {
        const msgsRes = await fetch(`/api/notebooks/${notebookId}/messages`);
        const msgsData = await msgsRes.json();
        if (msgsData.messages) {
          const formatted: ChatMessage[] = msgsData.messages.map(
            (m: { id: string; role: string; content: string; citations: string }) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              citations: JSON.parse(m.citations || '[]'),
            }),
          );
          setMessages(formatted);
        }
      } catch {
        // Keep streaming result if fetch fails
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== `assistant-${Date.now()}`),
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          citations: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mb-5">
                <Sparkles className="size-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1.5 font-[family-name:var(--font-heading)] tracking-tight">
                Start a conversation
              </h2>
              <p className="text-sm text-zinc-500 mb-8 text-center max-w-md leading-relaxed">
                {hasSources
                  ? 'Ask questions about your sources. Responses will be grounded with citations.'
                  : 'Add some sources first, then ask questions about them.'}
              </p>
              {hasSources && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_QUESTIONS.map((q, i) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSubmit(q.text)}
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
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="size-7 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="size-3 text-blue-400" />
                      </div>
                      <div className="bg-zinc-800/40 rounded-2xl rounded-tl-md px-4 py-3 min-w-0">
                        <div className="leading-relaxed whitespace-pre-wrap break-words">
                          {msg.citations && msg.citations.length > 0
                            ? renderMessageContent(msg.content, msg.citations, onCitationClick)
                            : renderMessageContent(msg.content, [], onCitationClick)}
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-2.5">
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.content === '' && (
                <TypingIndicator />
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 pb-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-2.5 shadow-lg shadow-black/10 transition-all duration-200 focus-within:border-zinc-700/80 focus-within:shadow-xl focus-within:shadow-black/20">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasSources
                  ? 'Ask about your sources...'
                  : 'Add sources to start chatting...'
              }
              disabled={!hasSources || isLoading}
              className="flex-1 bg-transparent border-0 text-white placeholder:text-zinc-600 resize-none min-h-[36px] max-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 p-1 text-sm"
              rows={1}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading || !hasSources}
              size="icon"
              className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 disabled:opacity-20 rounded-xl size-8 transition-all duration-200"
            >
              <Send className="size-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2 text-center">
            Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
