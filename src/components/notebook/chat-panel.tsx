'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SuggestedQuestions } from './suggested-questions';
import type { Citation } from '@/types';

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
}

function CitationBadge({
  index,
  onClick,
}: {
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 mx-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors cursor-pointer"
    >
      {index}
    </button>
  );
}

function renderMessageContent(
  content: string,
  citations: Citation[],
  onCitationClick: (citation: Citation) => void,
) {
  if (!content) return null;

  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const citationIndex = parseInt(match[1], 10);
    const citation = citations[citationIndex - 1];

    parts.push(
      <CitationBadge
        key={`cite-${match.index}`}
        index={citationIndex}
        onClick={() => {
          if (citation) onCitationClick(citation);
        }}
      />,
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>,
    );
  }

  return parts;
}

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
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
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
        <div className="max-w-3xl mx-auto px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Start a conversation
              </h2>
              <p className="text-zinc-400 text-sm mb-8 text-center max-w-md">
                {hasSources
                  ? 'Ask questions about your sources. The AI will cite relevant passages.'
                  : 'Add some sources first, then ask questions about them.'}
              </p>
              {hasSources && (
                <SuggestedQuestions
                  onSelect={(q) => handleSubmit(q)}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.role === 'assistant' && msg.citations && msg.citations.length > 0
                        ? renderMessageContent(msg.content, msg.citations, onCitationClick)
                        : msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-lg px-4 py-3 space-y-2">
                    <Skeleton className="h-4 w-64 bg-zinc-700" />
                    <Skeleton className="h-4 w-48 bg-zinc-700" />
                    <Skeleton className="h-4 w-56 bg-zinc-700" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-lg p-2">
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
              className="flex-1 bg-transparent border-0 text-white placeholder:text-zinc-500 resize-none min-h-[40px] max-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 p-1"
              rows={1}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading || !hasSources}
              size="icon"
              className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 disabled:opacity-30"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-zinc-600 mt-2 text-center">
            Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
