'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mic,
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
import { StudioPanel } from '@/components/notebook/studio-panel';
import { MindMapViewer } from '@/components/notebook/mind-map-viewer';
import { DataTableViewer } from '@/components/notebook/data-table-viewer';
import { TOCViewer } from '@/components/notebook/toc-viewer';
import { SlideViewer } from '@/components/notebook/slide-viewer';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Source, Notebook, Citation, Flashcard, QuizQuestion, MindMapNode, DataTableResult, TOCEntry, SlideContent } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface RightPanelState {
  type: 'studio' | 'source' | 'study-aid' | 'flashcard' | 'quiz' | 'mind-map' | 'data-table' | 'toc' | 'slides';
  source?: Source;
  highlightText?: string;
  studyAid?: { type: string; content: string };
  flashcards?: Flashcard[];
  quizQuestions?: QuizQuestion[];
  mindMap?: MindMapNode;
  dataTables?: DataTableResult[];
  tocEntries?: TOCEntry[];
  slides?: SlideContent[];
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
}: {
  notebookId: string;
  sources: Source[];
  onQuestionSelect: (q: string) => void;
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
      <div className="size-14 rounded-2xl bg-[var(--primary-container)] flex items-center justify-center mb-6">
        <Sparkles className="size-6 text-[var(--nlm-primary)]" />
      </div>
      <h2 className="text-xl font-medium text-[var(--text-primary)] mb-2 font-[family-name:var(--font-heading)] tracking-tight">
        Notebook Guide
      </h2>
      <p className="text-sm text-[var(--text-secondary)] text-center mb-8 max-w-md leading-relaxed">
        You have {sources.length} source{sources.length !== 1 ? 's' : ''} loaded. Ask questions about your sources or generate study materials.
      </p>

      {/* Suggested questions */}
      <div className="w-full mb-8">
        <p className="text-xs font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Suggested Questions</p>
        {guideLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--surface)] border border-[var(--outline)] animate-pulse" />
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
                  className="group flex items-start gap-3 p-3 rounded-xl border border-[var(--outline)] hover:bg-[var(--primary-container)] hover:border-[var(--nlm-primary)] transition-all duration-200 text-left cursor-pointer"
                >
                  <div className="size-7 rounded-lg bg-[var(--surface-container)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-container)] transition-colors duration-200">
                    <Icon className="size-3.5 text-[var(--text-secondary)] group-hover:text-[var(--nlm-primary)] transition-colors duration-200" />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--nlm-primary)] transition-colors duration-200 leading-relaxed">
                    {q}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
  const [rightPanel, setRightPanel] = useState<RightPanelState>({ type: 'studio' });
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
  const [studioLoading, setStudioLoading] = useState<string | null>(null);

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
        setRightPanel({ type: 'studio' });
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
    // Mind map
    if (type === 'mind-map') {
      setStudyAidLoading(true);
      setStudioLoading('mind-map');
      setRightPanel({ type: 'mind-map' });
      try {
        const savedRes = await fetch(`/api/notebooks/${id}/mind-map`);
        const savedData = await savedRes.json();
        if (savedData.result) {
          setRightPanel({ type: 'mind-map', mindMap: savedData.result });
        } else {
          const res = await fetch(`/api/notebooks/${id}/mind-map`, { method: 'POST' });
          const data = await res.json();
          setRightPanel({ type: 'mind-map', mindMap: data.result });
        }
      } catch {
        setRightPanel({ type: 'studio' });
      } finally {
        setStudyAidLoading(false);
        setStudioLoading(null);
      }
      return;
    }

    // Data table
    if (type === 'data-table') {
      setStudyAidLoading(true);
      setStudioLoading('data-table');
      setRightPanel({ type: 'data-table' });
      try {
        const savedRes = await fetch(`/api/notebooks/${id}/data-table`);
        const savedData = await savedRes.json();
        if (savedData.result) {
          const tables = Array.isArray(savedData.result) ? savedData.result : [savedData.result];
          setRightPanel({ type: 'data-table', dataTables: tables });
        } else {
          const res = await fetch(`/api/notebooks/${id}/data-table`, { method: 'POST' });
          const data = await res.json();
          const tables = Array.isArray(data.result) ? data.result : [data.result];
          setRightPanel({ type: 'data-table', dataTables: tables });
        }
      } catch {
        setRightPanel({ type: 'studio' });
      } finally {
        setStudyAidLoading(false);
        setStudioLoading(null);
      }
      return;
    }

    // TOC
    if (type === 'toc') {
      setStudyAidLoading(true);
      setStudioLoading('toc');
      setRightPanel({ type: 'toc' });
      try {
        const savedRes = await fetch(`/api/notebooks/${id}/toc`);
        const savedData = await savedRes.json();
        if (savedData.result) {
          const entries = Array.isArray(savedData.result) ? savedData.result : [];
          setRightPanel({ type: 'toc', tocEntries: entries });
        } else {
          const res = await fetch(`/api/notebooks/${id}/toc`, { method: 'POST' });
          const data = await res.json();
          const entries = Array.isArray(data.result) ? data.result : [];
          setRightPanel({ type: 'toc', tocEntries: entries });
        }
      } catch {
        setRightPanel({ type: 'studio' });
      } finally {
        setStudyAidLoading(false);
        setStudioLoading(null);
      }
      return;
    }

    // Slides
    if (type === 'slides') {
      setStudyAidLoading(true);
      setStudioLoading('slides');
      setRightPanel({ type: 'slides' });
      try {
        const savedRes = await fetch(`/api/notebooks/${id}/slides`);
        const savedData = await savedRes.json();
        if (savedData.result) {
          const slides = Array.isArray(savedData.result) ? savedData.result : [];
          setRightPanel({ type: 'slides', slides });
        } else {
          const res = await fetch(`/api/notebooks/${id}/slides`, { method: 'POST' });
          const data = await res.json();
          const slides = Array.isArray(data.result) ? data.result : [];
          setRightPanel({ type: 'slides', slides });
        }
      } catch {
        setRightPanel({ type: 'studio' });
      } finally {
        setStudyAidLoading(false);
        setStudioLoading(null);
      }
      return;
    }

    // Flashcards
    if (type === 'flashcard') {
      setStudyAidLoading(true);
      setStudioLoading('flashcard');
      setRightPanel({ type: 'flashcard', flashcards: [] });
      try {
        const savedRes = await fetch(`/api/notebooks/${id}/flashcards`);
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          if (savedData.flashcards && savedData.flashcards.length > 0) {
            setRightPanel({ type: 'flashcard', flashcards: savedData.flashcards });
            setStudyAidLoading(false);
            setStudioLoading(null);
            return;
          }
        }
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
        setRightPanel({ type: 'studio' });
      } finally {
        setStudyAidLoading(false);
        setStudioLoading(null);
      }
      return;
    }

    // Quiz
    if (type === 'quiz') {
      setStudyAidLoading(true);
      setStudioLoading('quiz');
      setRightPanel({ type: 'quiz', quizQuestions: [] });
      try {
        const savedRes = await fetch(`/api/notebooks/${id}/quiz`);
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          if (savedData.questions && savedData.questions.length > 0) {
            setRightPanel({ type: 'quiz', quizQuestions: savedData.questions });
            setStudyAidLoading(false);
            setStudioLoading(null);
            return;
          }
        }
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
        setRightPanel({ type: 'studio' });
      } finally {
        setStudyAidLoading(false);
        setStudioLoading(null);
      }
      return;
    }

    // Standard study aids (faq, study-guide, timeline, briefing)
    setStudyAidLoading(true);
    setStudioLoading(type);
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
      setRightPanel({ type: 'studio' });
    } finally {
      setStudyAidLoading(false);
      setStudioLoading(null);
    }
  }

  function handleRightPanelClose() {
    setRightPanel({ type: 'studio' });
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
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-[var(--nlm-primary)] animate-spin" />
          <span className="text-xs text-[var(--text-secondary)]">Loading notebook...</span>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg)] gap-4">
        <div className="size-14 rounded-2xl bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-center">
          <BookOpen className="size-6 text-[var(--text-secondary)]" />
        </div>
        <p className="text-sm text-[var(--text-secondary)]">Notebook not found</p>
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-2 rounded-full"
        >
          <ArrowLeft className="size-3.5" />
          Back to notebooks
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      {/* Top Bar */}
      <header className="shrink-0 border-b border-[var(--outline)] px-4 py-2 flex items-center justify-between bg-[var(--bg)]">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] shrink-0 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="size-3.5" />
          </Button>

          <div className="h-4 w-px bg-[var(--outline)] mx-0.5" />

          {leftCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setLeftCollapsed(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] shrink-0 rounded-lg transition-all duration-200"
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
              className="text-sm font-medium text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--outline)] rounded-lg px-2.5 py-1 outline-none focus:border-[var(--nlm-primary)] focus:ring-1 focus:ring-[var(--nlm-primary)]/20 min-w-[200px] transition-all duration-200"
            />
          ) : (
            <button
              onClick={() => {
                setEditingTitle(true);
                setTitleInput(notebook.title);
              }}
              className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--nlm-primary)] transition-colors duration-200 truncate cursor-pointer"
            >
              {notebook.title}
            </button>
          )}

          <Badge className="bg-[var(--surface-container)] text-[var(--text-secondary)] hover:bg-[var(--surface-container)] text-[11px] shrink-0 border-none">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setInstructionsDraft(customInstructions);
              setInstructionsDialogOpen(true);
            }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] shrink-0 rounded-lg transition-all duration-200"
            title="Custom Instructions"
          >
            <Settings2 className="size-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] rounded-lg transition-all duration-200 cursor-pointer text-sm" />
              }
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline text-xs">Export</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--bg)] border-[var(--outline)] min-w-[180px]">
              <DropdownMenuItem
                onClick={() => handleExport('json')}
                className="gap-2 text-[var(--text-primary)] cursor-pointer"
              >
                <FileText className="size-3.5" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('chat')}
                className="gap-2 text-[var(--text-primary)] cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                Export Chat (.md)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport('markdown')}
                className="gap-2 text-[var(--text-primary)] cursor-pointer"
              >
                <FileCode className="size-3.5" />
                Export Sources (.md)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setAudioDialogOpen(true)}
            variant="ghost"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] gap-2 shrink-0 rounded-lg transition-all duration-200"
          >
            <Mic className="size-3.5" />
            <span className="hidden sm:inline text-xs">Audio Overview</span>
          </Button>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel — Sources */}
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

        {/* Center Panel — Chat or Guide */}
        {showGuide ? (
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-auto bg-[var(--bg)]">
            <NotebookGuidePanel
              notebookId={id}
              sources={sources}
              onQuestionSelect={(q) => {
                setMessages([{
                  id: `user-${Date.now()}`,
                  role: 'user',
                  content: q,
                  citations: [],
                }]);
              }}
            />
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

        {/* Right Panel — Studio (default) or viewer */}
        {rightPanel.type === 'studio' && (
          <div className="animate-slide-right">
            <StudioPanel
              onOutputRequest={handleStudyAidRequest}
              onAudioRequest={() => setAudioDialogOpen(true)}
              onClose={() => {/* Studio is default, keep it open */}}
              loading={studioLoading}
            />
          </div>
        )}

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
            <div className="w-[380px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-[var(--nlm-primary)] animate-spin" />
              <p className="text-xs text-[var(--text-secondary)]">Generating {rightPanel.studyAid.type}...</p>
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
            <div className="w-[400px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-[var(--nlm-primary)] animate-spin" />
              <p className="text-xs text-[var(--text-secondary)]">Generating flashcards...</p>
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
            <div className="w-[400px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-[var(--nlm-primary)] animate-spin" />
              <p className="text-xs text-[var(--text-secondary)]">Generating quiz...</p>
            </div>
          ) : rightPanel.quizQuestions && rightPanel.quizQuestions.length > 0 ? (
            <QuizViewer
              questions={rightPanel.quizQuestions}
              onClose={handleRightPanelClose}
            />
          ) : null
        )}

        {rightPanel.type === 'mind-map' && (
          studyAidLoading ? (
            <div className="w-[400px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-[var(--nlm-primary)] animate-spin" />
              <p className="text-xs text-[var(--text-secondary)]">Generating mind map...</p>
            </div>
          ) : rightPanel.mindMap ? (
            <div className="animate-slide-right">
              <MindMapViewer
                data={rightPanel.mindMap}
                onClose={handleRightPanelClose}
              />
            </div>
          ) : null
        )}

        {rightPanel.type === 'data-table' && (
          studyAidLoading ? (
            <div className="w-[400px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-[var(--nlm-primary)] animate-spin" />
              <p className="text-xs text-[var(--text-secondary)]">Generating data table...</p>
            </div>
          ) : rightPanel.dataTables && rightPanel.dataTables.length > 0 ? (
            <div className="animate-slide-right">
              <DataTableViewer
                tables={rightPanel.dataTables}
                onClose={handleRightPanelClose}
              />
            </div>
          ) : null
        )}

        {rightPanel.type === 'toc' && (
          studyAidLoading ? (
            <div className="w-[400px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-[var(--nlm-primary)] animate-spin" />
              <p className="text-xs text-[var(--text-secondary)]">Generating table of contents...</p>
            </div>
          ) : rightPanel.tocEntries && rightPanel.tocEntries.length > 0 ? (
            <div className="animate-slide-right">
              <TOCViewer
                entries={rightPanel.tocEntries}
                onClose={handleRightPanelClose}
              />
            </div>
          ) : null
        )}

        {rightPanel.type === 'slides' && (
          studyAidLoading ? (
            <div className="w-[400px] shrink-0 bg-[var(--surface-container)] border-l border-[var(--outline)] flex flex-col items-center justify-center gap-3 animate-slide-right">
              <Loader2 className="size-5 text-[var(--nlm-primary)] animate-spin" />
              <p className="text-xs text-[var(--text-secondary)]">Generating slides...</p>
            </div>
          ) : rightPanel.slides && rightPanel.slides.length > 0 ? (
            <div className="animate-slide-right">
              <SlideViewer
                slides={rightPanel.slides}
                onClose={handleRightPanelClose}
              />
            </div>
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
        <DialogContent className="bg-[var(--bg)] border border-[var(--outline)] sm:max-w-md rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Custom Instructions</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[var(--text-secondary)] -mt-1">
            Tell the AI how to respond. These instructions apply to all chats in this notebook.
          </p>
          <Textarea
            value={instructionsDraft}
            onChange={(e) => setInstructionsDraft(e.target.value)}
            placeholder="e.g. Respond in bullet points. Focus on practical examples. Use simple language."
            maxLength={10000}
            rows={5}
            className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm resize-none focus-visible:ring-[var(--nlm-primary)]/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">
              {instructionsDraft.length}/10000
            </span>
            <DialogFooter className="m-0 border-0 bg-transparent p-0 flex-row">
              <Button
                variant="ghost"
                onClick={() => setInstructionsDialogOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveInstructions}
                disabled={instructionsSaving}
                className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full text-xs"
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
