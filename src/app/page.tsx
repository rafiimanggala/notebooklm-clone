'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  BookOpen,
  FileText,
  Loader2,
  Globe,
  Video,
  AlignLeft,
  Sparkles,
  Clock,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import type { Notebook } from '@/types';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SOURCE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  url: Globe,
  youtube: Video,
  text: AlignLeft,
};

interface NotebookWithCounts extends Notebook {
  sourceCount?: number;
  sourceTypes?: string[];
}

export default function NotebooksPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<NotebookWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotebooks = useCallback(async () => {
    try {
      const res = await fetch('/api/notebooks');
      const data = await res.json();
      setNotebooks(data.notebooks ?? []);
    } catch (err) {
      console.error('Failed to fetch notebooks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.notebook) {
        setDialogOpen(false);
        setNewTitle('');
        setNewDescription('');
        router.push(`/notebook/${data.notebook.id}`);
      }
    } catch (err) {
      console.error('Failed to create notebook:', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(notebookId: string) {
    setDeletingId(notebookId);
    try {
      await fetch(`/api/notebooks/${notebookId}`, { method: 'DELETE' });
      setNotebooks((prev) => prev.filter((nb) => nb.id !== notebookId));
    } catch (err) {
      console.error('Failed to delete notebook:', err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.07] via-blue-500/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/60 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="size-4 text-blue-400" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white font-[family-name:var(--font-heading)]">
              NotebookLM
            </span>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-lg h-8 px-3 text-sm transition-all duration-200" />
              }
            >
              <Plus className="size-3.5" />
              New Notebook
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-white text-lg font-semibold font-[family-name:var(--font-heading)]">
                  Create New Notebook
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="My Research Notebook"
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-lg h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-400">Description (optional)</label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What is this notebook about?"
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 resize-none rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="bg-zinc-900/50 border-zinc-800/60">
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  {creating && <Loader2 className="size-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero text */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-[28px] font-semibold tracking-tight text-white font-[family-name:var(--font-heading)] mb-1.5">
              Your Notebooks
            </h1>
            <p className="text-sm text-zinc-500">
              Upload sources, ask questions, and generate insights with AI.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl bg-zinc-900/80 border border-zinc-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : notebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="size-20 rounded-2xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center mb-6">
                <Sparkles className="size-8 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2 font-[family-name:var(--font-heading)]">
                No notebooks yet
              </h2>
              <p className="text-sm text-zinc-500 mb-8 max-w-sm leading-relaxed">
                Create your first notebook to start uploading sources and chatting with your documents.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-lg h-9 px-4 transition-all duration-200"
              >
                <Plus className="size-4" />
                Create Notebook
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notebooks.map((nb, idx) => (
                <button
                  key={nb.id}
                  onClick={() => router.push(`/notebook/${nb.id}`)}
                  className="group text-left p-5 rounded-xl bg-zinc-900/80 border border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 cursor-pointer animate-fade-in relative"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="size-4 text-blue-400" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="size-7 rounded-md flex items-center justify-center text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-zinc-800 hover:text-zinc-300 transition-all duration-200 cursor-pointer"
                          />
                        }
                      >
                        <MoreVertical className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 min-w-[140px]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(nb.id);
                          }}
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10 gap-2 cursor-pointer"
                        >
                          {deletingId === nb.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Card body */}
                  <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors duration-200 line-clamp-1 mb-1">
                    {nb.title}
                  </h3>
                  {nb.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                      {nb.description}
                    </p>
                  )}

                  {/* Card footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      {nb.sourceTypes && nb.sourceTypes.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {[...new Set(nb.sourceTypes)].slice(0, 4).map((type) => {
                            const Icon = SOURCE_TYPE_ICONS[type] ?? FileText;
                            return (
                              <div key={type} className="size-5 rounded bg-zinc-800/80 flex items-center justify-center">
                                <Icon className="size-2.5 text-zinc-500" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-600">
                          {nb.sourceCount !== undefined && nb.sourceCount > 0
                            ? `${nb.sourceCount} source${nb.sourceCount !== 1 ? 's' : ''}`
                            : 'No sources'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-600">
                      <Clock className="size-3" />
                      <span className="text-[11px]">{formatDate(nb.updatedAt)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
