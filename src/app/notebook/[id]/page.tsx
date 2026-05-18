'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mic,
  ChevronRight,
  Loader2,
  BookOpen,
  PanelLeftClose,
  Sparkles,
  FileText,
  Lightbulb,
  ListChecks,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SourcePanel } from '@/components/notebook/source-panel';
import { ChatPanel } from '@/components/notebook/chat-panel';
import { SourceViewer } from '@/components/notebook/source-viewer';
import { StudyAidViewer } from '@/components/notebook/study-aid-viewer';
import { AudioDialog } from '@/components/notebook/audio-dialog';
import { FlashcardViewer } from '@/components/notebook/flashcard-viewer';
import { QuizViewer } from '@/components/notebook/quiz-viewer';
import type { Source, Notebook, Citation, Flashcard, QuizQuestion } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface RightPanelState {
  type: 'source' | 'study-aid' | 'flashcard' | 'quiz' | null;
  source?: Source;
  highlightText?: string;
  studyAid?: { type: string; content: string };
  flashcards?: Flashcard[];
  quizQuestions?: QuizQuestion[];
}

// Notebook Guide component - shows when sources exist but no chat yet
function NotebookGuidePanel({
  sources,
  onQuestionSelect,
  onStudyAidRequest,
}: {
  notebookId: string;
  sources: Source[];
  onQuestionSelect: (q: string) => void;
  onStudyAidRequest: (type: string) => void;
}) {
  const suggestedQuestions = [
    'What are the main topics covered in my sources?',
    'Can you summarize the key findings?',
    'What are the most important takeaways?',
    'Are there any conflicting viewpoints across sources?',
  ];

  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 max-w-2xl mx-auto animate-fade-in">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mb-6">
        <Sparkles className="size-6 text-blue-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2 font-[family-name:var(--font-heading)] tracking-tight">
        Notebook Guide
      </h2>
      <p className="text-sm text-zinc-500 text-center mb-8 max-w-md leading-relaxed">
        You have {sources.length} source{sources.length !== 1 ? 's' : ''} loaded. Ask questions about your sources or generate study materials.
      </p>

      {/* Suggested questions */}
      <div className="w-full mb-8">
        <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Suggested Questions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestedQuestions.map((q, i) => {
            const icons = [FileText, Lightbulb, ListChecks, HelpCircle];
            const Icon = icons[i % icons.length];
            return (
              <button
                key={i}
                onClick={() => onQuestionSelect(q)}
                className="group flex items-start gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/60 hover:bg-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 text-left cursor-pointer"
              >
                <div className="size-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 transition-colors duration-200">
                  <Icon className="size-3.5 text-zinc-500 group-hover:text-blue-400 transition-colors duration-200" />
                </div>
                <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200 leading-relaxed">
                  {q}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Study tools */}
      <div className="w-full">
        <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Study Tools</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'faq', label: 'FAQ', icon: HelpCircle },
            { type: 'study-guide', label: 'Study Guide', icon: BookOpen },
            { type: 'briefing', label: 'Briefing', icon: FileText },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => onStudyAidRequest(type)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/60 hover:bg-zinc-800/80 hover:border-zinc-700/80 transition-all duration-200 cursor-pointer group"
            >
              <Icon className="size-4 text-zinc-500 group-hover:text-blue-400 transition-colors duration-200" />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NotebookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightPanel, setRightPanel] = useState<RightPanelState>({ type: null });
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [studyAidLoading, setStudyAidLoading] = useState(false);
  const [enabledSourceIds, setEnabledSourceIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [notebookRes, sourcesRes, messagesRes] = await Promise.all([
        fetch(`/api/notebooks/${id}`),
        fetch(`/api/notebooks/${id}/sources`),
        fetch(`/api/notebooks/${id}/messages`),
      ]);

      const notebookData = await notebookRes.json();
      const sourcesData = await sourcesRes.json();
      const messagesData = await messagesRes.json();

      if (notebookData.notebook) {
        setNotebook(notebookData.notebook);
        setTitleInput(notebookData.notebook.title);
      }
      if (sourcesData.sources) {
        setSources(sourcesData.sources);
        // Enable all sources by default
        setEnabledSourceIds(new Set(sourcesData.sources.map((s: Source) => s.id)));
      }
      if (messagesData.messages) {
        const formatted: ChatMessage[] = messagesData.messages.map(
          (m: { id: string; role: string; content: string; citations: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            citations: JSON.parse(m.citations || '[]'),
          }),
        );
        setMessages(formatted);
      }
    } catch (err) {
      console.error('Failed to load notebook data:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleTitleSave() {
    if (!titleInput.trim() || titleInput.trim() === notebook?.title) {
      setEditingTitle(false);
      setTitleInput(notebook?.title ?? '');
      return;
    }

    try {
      const res = await fetch(`/api/notebooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleInput.trim() }),
      });
      const data = await res.json();
      if (data.notebook) {
        setNotebook(data.notebook);
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    }
    setEditingTitle(false);
  }

  function handleSourceSelect(source: Source) {
    setSelectedSourceId(source.id);
    setRightPanel({
      type: 'source',
      source,
      highlightText: undefined,
    });
  }

  function handleSourceDelete(sourceId: string) {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    setEnabledSourceIds((prev) => {
      const next = new Set(prev);
      next.delete(sourceId);
      return next;
    });
    if (selectedSourceId === sourceId) {
      setSelectedSourceId(null);
      if (rightPanel.type === 'source') {
        setRightPanel({ type: null });
      }
    }
  }

  function handleSourceAdd(source: Source) {
    setSources((prev) => [...prev, source]);
    setEnabledSourceIds((prev) => new Set([...prev, source.id]));
  }

  function handleToggleSource(sourceId: string) {
    setEnabledSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  }

  function handleCitationClick(citation: Citation) {
    const source = sources.find((s) => s.id === citation.sourceId);
    if (source) {
      setSelectedSourceId(source.id);
      setRightPanel({
        type: 'source',
        source,
        highlightText: citation.text?.slice(0, 200),
      });
    }
  }

  async function handleStudyAidRequest(type: string) {
    if (type === 'flashcard') {
      setStudyAidLoading(true);
      setRightPanel({ type: 'flashcard', flashcards: [] });
      try {
        const res = await fetch(`/api/notebooks/${id}/study-aids`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'flashcard' }),
        });
        const data = await res.json();
        if (data.flashcards) {
          setRightPanel({ type: 'flashcard', flashcards: data.flashcards });
        }
      } catch (err) {
        console.error('Failed to generate flashcards:', err);
        setRightPanel({ type: null });
      } finally {
        setStudyAidLoading(false);
      }
      return;
    }

    if (type === 'quiz') {
      setStudyAidLoading(true);
      setRightPanel({ type: 'quiz', quizQuestions: [] });
      try {
        const res = await fetch(`/api/notebooks/${id}/study-aids`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'quiz' }),
        });
        const data = await res.json();
        if (data.questions) {
          setRightPanel({ type: 'quiz', quizQuestions: data.questions });
        }
      } catch (err) {
        console.error('Failed to generate quiz:', err);
        setRightPanel({ type: null });
      } finally {
        setStudyAidLoading(false);
      }
      return;
    }

    // Standard study aids
    setStudyAidLoading(true);
    setRightPanel({
      type: 'study-aid',
      studyAid: { type, content: '' },
    });

    try {
      const res = await fetch(`/api/notebooks/${id}/study-aids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();

      if (data.studyAid) {
        setRightPanel({
          type: 'study-aid',
          studyAid: { type, content: data.studyAid.content },
        });
      }
    } catch (err) {
      console.error('Failed to generate study aid:', err);
      setRightPanel({ type: null });
    } finally {
      setStudyAidLoading(false);
    }
  }

  function handleRightPanelClose() {
    setRightPanel({ type: null });
    setSelectedSourceId(null);
  }

  // Determine if we should show the notebook guide
  const showGuide = sources.length > 0 && messages.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-blue-400 animate-spin" />
          <span className="text-xs text-zinc-500">Loading notebook...</span>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 gap-4">
        <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center">
          <BookOpen className="size-6 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">Notebook not found</p>
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-zinc-400 hover:text-white gap-2 rounded-lg"
        >
          <ArrowLeft className="size-3.5" />
          Back to notebooks
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Top Bar */}
      <header className="shrink-0 border-b border-zinc-800/60 px-4 py-2 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/')}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 shrink-0 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="size-3.5" />
          </Button>

          <div className="h-4 w-px bg-zinc-800 mx-0.5" />

          {leftCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setLeftCollapsed(false)}
              className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 shrink-0 rounded-lg transition-all duration-200"
            >
              <PanelLeftClose className="size-3.5 rotate-180" />
            </Button>
          )}

          {editingTitle ? (
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setEditingTitle(false);
                  setTitleInput(notebook.title);
                }
              }}
              autoFocus
              className="text-sm font-medium text-white bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-2.5 py-1 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 min-w-[200px] transition-all duration-200"
            />
          ) : (
            <button
              onClick={() => {
                setEditingTitle(true);
                setTitleInput(notebook.title);
              }}
              className="text-sm font-medium text-white hover:text-blue-400 transition-colors duration-200 truncate cursor-pointer"
            >
              {notebook.title}
            </button>
          )}

          <Badge className="bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800/80 text-[11px] shrink-0 border-none">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <Button
          onClick={() => setAudioDialogOpen(true)}
          variant="ghost"
          className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 gap-2 shrink-0 rounded-lg transition-all duration-200"
        >
          <Mic className="size-3.5" />
          <span className="hidden sm:inline text-xs">Audio Overview</span>
        </Button>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        {!leftCollapsed && (
          <div className="animate-slide-left">
            <SourcePanel
              notebookId={id}
              sources={sources}
              selectedSourceId={selectedSourceId}
              enabledSourceIds={enabledSourceIds}
              onSourceSelect={handleSourceSelect}
              onSourceDelete={handleSourceDelete}
              onSourceAdd={handleSourceAdd}
              onToggleSource={handleToggleSource}
              onStudyAidRequest={handleStudyAidRequest}
              onCollapse={() => setLeftCollapsed(true)}
            />
          </div>
        )}

        {/* Center Panel */}
        {showGuide ? (
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-auto">
            <NotebookGuidePanel
              notebookId={id}
              sources={sources}
              onQuestionSelect={(q) => {
                // Transition from guide to chat by triggering the first message
                setMessages([{
                  id: `user-${Date.now()}`,
                  role: 'user',
                  content: q,
                  citations: [],
                }]);
              }}
              onStudyAidRequest={handleStudyAidRequest}
            />
            {/* Still render the chat panel underneath so it handles the actual submission */}
            <div className="hidden">
              <ChatPanel
                notebookId={id}
                initialMessages={messages}
                onCitationClick={handleCitationClick}
                hasSources={sources.length > 0}
                enabledSourceIds={enabledSourceIds}
              />
            </div>
          </div>
        ) : (
          <ChatPanel
            notebookId={id}
            initialMessages={messages}
            onCitationClick={handleCitationClick}
            hasSources={sources.length > 0}
            enabledSourceIds={enabledSourceIds}
          />
        )}

        {/* Right Panel */}
        {rightPanel.type === 'source' && rightPanel.source && (
          <div className="animate-slide-right">
            <SourceViewer
              source={rightPanel.source}
              highlightText={rightPanel.highlightText}
              onClose={handleRightPanelClose}
            />
          </div>
        )}

        {rightPanel.type === 'study-aid' && rightPanel.studyAid && (
          studyAidLoading ? (
            <div className="w-[380px] shrink-0 bg-zinc-900/50 border-l border-zinc-800/60 flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-blue-400 animate-spin" />
              <p className="text-xs text-zinc-500">Generating {rightPanel.studyAid.type}...</p>
            </div>
          ) : (
            <div className="animate-slide-right">
              <StudyAidViewer
                type={rightPanel.studyAid.type as 'faq' | 'study-guide' | 'timeline' | 'briefing'}
                content={rightPanel.studyAid.content}
                onClose={handleRightPanelClose}
              />
            </div>
          )
        )}

        {rightPanel.type === 'flashcard' && (
          studyAidLoading ? (
            <div className="w-[400px] shrink-0 bg-zinc-900/50 border-l border-zinc-800/60 flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-blue-400 animate-spin" />
              <p className="text-xs text-zinc-500">Generating flashcards...</p>
            </div>
          ) : rightPanel.flashcards && rightPanel.flashcards.length > 0 ? (
            <FlashcardViewer
              flashcards={rightPanel.flashcards}
              onClose={handleRightPanelClose}
            />
          ) : null
        )}

        {rightPanel.type === 'quiz' && (
          studyAidLoading ? (
            <div className="w-[400px] shrink-0 bg-zinc-900/50 border-l border-zinc-800/60 flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-blue-400 animate-spin" />
              <p className="text-xs text-zinc-500">Generating quiz...</p>
            </div>
          ) : rightPanel.quizQuestions && rightPanel.quizQuestions.length > 0 ? (
            <QuizViewer
              questions={rightPanel.quizQuestions}
              onClose={handleRightPanelClose}
            />
          ) : null
        )}
      </div>

      {/* Audio Dialog */}
      <AudioDialog
        open={audioDialogOpen}
        onOpenChange={setAudioDialogOpen}
        notebookId={id}
        hasSources={sources.length > 0}
      />
    </div>
  );
}
