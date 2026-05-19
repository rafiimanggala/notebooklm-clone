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
  Download,
  FileCode,
  MessageSquare,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
const FALLBACK_QUESTIONS = [
  'What are the main topics covered in my sources?',
  'Can you summarize the key findings?',
  'What are the most important takeaways?',
  'Are there any conflicting viewpoints across sources?',
];

function NotebookGuidePanel({
  notebookId,
  sources,
  onQuestionSelect,
  onStudyAidRequest,
}: {
  notebookId: string;
  sources: Source[];
  onQuestionSelect: (q: string) => void;
  onStudyAidRequest: (type: string) => void;
}) {
  const [guideQuestions, setGuideQuestions] = useState<string[]>([]);
  const [guideLoading, setGuideLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadGuide() {
      try {
        const res = await fetch(`/api/notebooks/${notebookId}/guide`);
        if (!res.ok) throw new Error('Guide fetch failed');
        const data = await res.json();
        if (!cancelled && data.suggestedQuestions?.length > 0) {
          setGuideQuestions(data.suggestedQuestions);
        }
      } catch {
        // Use fallback questions on error
      } finally {
        if (!cancelled) setGuideLoading(false);
      }
    }
    loadGuide();
    return () => { cancelled = true; };
  }, [notebookId]);

  const questions = guideQuestions.length > 0 ? guideQuestions : FALLBACK_QUESTIONS;

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
        {guideLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-900/80 border border-zinc-800/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {questions.map((q, i) => {
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
        )}
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
  const [customInstructions, setCustomInstructions] = useState('');
  const [chatStyle, setChatStyle] = useState('default');
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [instructionsDraft, setInstructionsDraft] = useState('');
  const [instructionsSaving, setInstructionsSaving] = useState(false);

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
        setCustomInstructions(notebookData.notebook.customInstructions ?? '');
        setChatStyle(notebookData.notebook.chatStyle ?? 'default');
      }
      if (sourcesData.sources) {
        setSources(sourcesData.sources);
        // Respect enabled field from DB — if field absent treat as enabled
        setEnabledSourceIds(new Set(
          sourcesData.sources
            .filter((s: Source & { enabled?: number }) => s.enabled !== 0)
            .map((s: Source) => s.id)
        ));
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
    const currentlyEnabled = enabledSourceIds.has(sourceId);
    setEnabledSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
    // Persist toggle to backend
    fetch(`/api/notebooks/${id}/sources/${sourceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !currentlyEnabled }),
    }).catch((err) => console.error('Failed to toggle source:', err));
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
        // Try loading saved flashcards first
        const savedRes = await fetch(`/api/notebooks/${id}/flashcards`);
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          if (savedData.flashcards && savedData.flashcards.length > 0) {
            setRightPanel({ type: 'flashcard', flashcards: savedData.flashcards });
            setStudyAidLoading(false);
            return;
          }
        }
        // No saved data — generate new
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
        // Try loading saved quiz first
        const savedRes = await fetch(`/api/notebooks/${id}/quiz`);
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          if (savedData.questions && savedData.questions.length > 0) {
            setRightPanel({ type: 'quiz', quizQuestions: savedData.questions });
            setStudyAidLoading(false);
            return;
          }
        }
        // No saved data — generate new
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

  async function handleExport(format: 'json' | 'chat' | 'markdown') {
    try {
      const res = await fetch(`/api/notebooks/${id}/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') ?? '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] ?? `notebook-export.${format === 'json' ? 'json' : 'md'}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  async function handleSaveInstructions() {
    setInstructionsSaving(true);
    try {
      const res = await fetch(`/api/notebooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customInstructions: instructionsDraft }),
      });
      const data = await res.json();
      if (data.notebook) {
        setNotebook(data.notebook);
      }
      setCustomInstructions(instructionsDraft);
      setInstructionsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save instructions:', err);
    } finally {
      setInstructionsSaving(false);
    }
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

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setInstructionsDraft(customInstructions);
              setInstructionsDialogOpen(true);
            }}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 shrink-0 rounded-lg transition-all duration-200"
            title="Custom Instructions"
          >
            <Settings2 className="size-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-all duration-200 cursor-pointer text-sm" />
              }
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline text-xs">Export</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 min-w-[180px]">
              <DropdownMenuItem
                onClick={() => handleExport('json')}
                className="gap-2 text-zinc-300 cursor-pointer"
              >
                <FileText className="size-3.5" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('chat')}
                className="gap-2 text-zinc-300 cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                Export Chat (.md)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('markdown')}
                className="gap-2 text-zinc-300 cursor-pointer"
              >
                <FileCode className="size-3.5" />
                Export Sources (.md)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setAudioDialogOpen(true)}
            variant="ghost"
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 gap-2 shrink-0 rounded-lg transition-all duration-200"
          >
            <Mic className="size-3.5" />
            <span className="hidden sm:inline text-xs">Audio Overview</span>
          </Button>
        </div>
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
                chatStyle={chatStyle}
                onChatStyleChange={(style) => {
                  setChatStyle(style);
                  fetch(`/api/notebooks/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatStyle: style }),
                  }).catch((err) => console.error('Failed to save chat style:', err));
                }}
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
            chatStyle={chatStyle}
            onChatStyleChange={(style) => {
              setChatStyle(style);
              fetch(`/api/notebooks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatStyle: style }),
              }).catch((err) => console.error('Failed to save chat style:', err));
            }}
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

      {/* Custom Instructions Dialog */}
      <Dialog open={instructionsDialogOpen} onOpenChange={setInstructionsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Custom Instructions</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-500 -mt-1">
            Tell the AI how to respond. These instructions apply to all chats in this notebook.
          </p>
          <Textarea
            value={instructionsDraft}
            onChange={(e) => setInstructionsDraft(e.target.value)}
            placeholder="e.g. Respond in bullet points. Focus on practical examples. Use simple language."
            maxLength={10000}
            rows={5}
            className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-600 text-sm resize-none focus-visible:ring-blue-500/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">
              {instructionsDraft.length}/10000
            </span>
            <DialogFooter className="m-0 border-0 bg-transparent p-0 flex-row">
              <Button
                variant="ghost"
                onClick={() => setInstructionsDialogOpen(false)}
                className="text-zinc-400 hover:text-white rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveInstructions}
                disabled={instructionsSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs"
              >
                {instructionsSaving ? (
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
