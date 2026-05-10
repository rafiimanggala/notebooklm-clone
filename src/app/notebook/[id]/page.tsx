'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mic,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SourcePanel } from '@/components/notebook/source-panel';
import { ChatPanel } from '@/components/notebook/chat-panel';
import { SourceViewer } from '@/components/notebook/source-viewer';
import { StudyAidViewer } from '@/components/notebook/study-aid-viewer';
import { AudioDialog } from '@/components/notebook/audio-dialog';
import type { Source, Notebook, Citation } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface RightPanelState {
  type: 'source' | 'study-aid' | null;
  source?: Source;
  highlightText?: string;
  studyAid?: { type: 'faq' | 'study-guide' | 'timeline' | 'briefing'; content: string };
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
    if (selectedSourceId === sourceId) {
      setSelectedSourceId(null);
      if (rightPanel.type === 'source') {
        setRightPanel({ type: null });
      }
    }
  }

  function handleSourceAdd(source: Source) {
    setSources((prev) => [...prev, source]);
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

  async function handleStudyAidRequest(type: 'faq' | 'study-guide' | 'timeline' | 'briefing') {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="size-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 gap-4">
        <p className="text-zinc-400">Notebook not found</p>
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to notebooks
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Top Bar */}
      <header className="shrink-0 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between bg-zinc-900">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/')}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>

          {leftCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setLeftCollapsed(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
            >
              <ChevronRight className="size-4" />
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
              className="text-sm font-medium text-white bg-zinc-800 border border-zinc-700 rounded px-2 py-1 outline-none focus:border-blue-500 min-w-[200px]"
            />
          ) : (
            <button
              onClick={() => {
                setEditingTitle(true);
                setTitleInput(notebook.title);
              }}
              className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate cursor-pointer"
            >
              {notebook.title}
            </button>
          )}

          <Badge className="bg-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs shrink-0">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <Button
          onClick={() => setAudioDialogOpen(true)}
          variant="ghost"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2 shrink-0"
        >
          <Mic className="size-4" />
          <span className="hidden sm:inline text-sm">Audio Overview</span>
        </Button>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        {!leftCollapsed && (
          <SourcePanel
            notebookId={id}
            sources={sources}
            selectedSourceId={selectedSourceId}
            collapsed={leftCollapsed}
            onSourceSelect={handleSourceSelect}
            onSourceDelete={handleSourceDelete}
            onSourceAdd={handleSourceAdd}
            onStudyAidRequest={handleStudyAidRequest}
            onCollapse={() => setLeftCollapsed(true)}
          />
        )}

        {/* Center Panel */}
        <ChatPanel
          notebookId={id}
          initialMessages={messages}
          onCitationClick={handleCitationClick}
          hasSources={sources.length > 0}
        />

        {/* Right Panel */}
        {rightPanel.type === 'source' && rightPanel.source && (
          <SourceViewer
            source={rightPanel.source}
            highlightText={rightPanel.highlightText}
            onClose={handleRightPanelClose}
          />
        )}

        {rightPanel.type === 'study-aid' && rightPanel.studyAid && (
          studyAidLoading ? (
            <div className="w-[350px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-6 text-zinc-400 animate-spin" />
              <p className="text-sm text-zinc-500">Generating {rightPanel.studyAid.type}...</p>
            </div>
          ) : (
            <StudyAidViewer
              type={rightPanel.studyAid.type}
              content={rightPanel.studyAid.content}
              onClose={handleRightPanelClose}
            />
          )
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
