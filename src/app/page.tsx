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
  Search,
  Upload,
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
import { ThemeToggle } from '@/components/theme-toggle';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);

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

  const filteredNotebooks = searchQuery.trim()
    ? notebooks.filter((nb) => nb.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : notebooks;

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

  async function handleImport(file: File) {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/notebooks/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.notebook) {
        router.push(`/notebook/${data.notebook.id}`);
      }
    } catch (err) {
      console.error('Failed to import notebook:', err);
    } finally {
      setImporting(false);
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
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--outline)] bg-[var(--bg)] px-6 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
          {/* Left — Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="size-8 rounded-lg bg-[var(--primary-container)] flex items-center justify-center">
              <BookOpen className="size-4 text-[var(--nlm-primary)]" />
            </div>
            <span className="text-base font-semibold tracking-tight text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
              NotebookLM
            </span>
          </div>

          {/* Center — Search */}
          <div className="flex-1 max-w-[400px] relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-secondary)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notebooks..."
              className="w-full h-9 pl-9 pr-4 bg-[var(--surface-container)] border border-[var(--outline)] rounded-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--nlm-primary)] focus:ring-1 focus:ring-[var(--nlm-primary)] transition-all duration-200"
            />
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            <Button
              variant="ghost"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImport(file);
                };
                input.click();
              }}
              disabled={importing}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] gap-2 rounded-full h-9 px-4 text-sm transition-all duration-200"
            >
              {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              <span className="hidden sm:inline">Import</span>
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] gap-2 rounded-full h-9 px-4 text-sm font-medium transition-all duration-200" />
                }
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Notebook</span>
              </DialogTrigger>
              <DialogContent className="bg-[var(--bg)] border border-[var(--outline)] text-[var(--text-primary)] sm:max-w-md rounded-[28px]">
                <DialogHeader>
                  <DialogTitle className="text-[var(--text-primary)] text-lg font-semibold font-[family-name:var(--font-heading)]">
                    Create New Notebook
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Title</label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="My Research Notebook"
                      className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-9"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate();
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Description (optional)</label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="What is this notebook about?"
                      className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="bg-transparent border-0">
                  <Button
                    variant="ghost"
                    onClick={() => setDialogOpen(false)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || creating}
                    className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full"
                  >
                    {creating && <Loader2 className="size-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Section header */}
          <div className="mb-6 flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-[24px] font-medium tracking-tight text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-1">
                Your Notebooks
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Upload sources, ask questions, and generate insights with AI.
              </p>
            </div>
            <span className="text-xs text-[var(--text-secondary)] hidden sm:block">Most recent</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[160px] rounded-xl bg-[var(--surface)] border border-[var(--outline)] animate-pulse"
                />
              ))}
            </div>
          ) : filteredNotebooks.length === 0 && notebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="size-20 rounded-2xl bg-[var(--surface)] border border-[var(--outline)] flex items-center justify-center mb-6">
                <Sparkles className="size-8 text-[var(--text-secondary)]" />
              </div>
              <h2 className="text-xl font-medium text-[var(--text-primary)] mb-2 font-[family-name:var(--font-heading)]">
                Create your first notebook
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-sm leading-relaxed">
                Create a notebook to start uploading sources and chatting with your documents.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] gap-2 rounded-full h-10 px-5 transition-all duration-200"
              >
                <Plus className="size-4" />
                Create Notebook
              </Button>
            </div>
          ) : filteredNotebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <p className="text-sm text-[var(--text-secondary)]">No notebooks match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotebooks.map((nb, idx) => (
                <div
                  key={nb.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/notebook/${nb.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/notebook/${nb.id}`); }}
                  className="group text-left p-4 rounded-xl bg-[var(--surface)] border border-[var(--outline)] hover:shadow-[var(--shadow-2)] transition-all duration-200 cursor-pointer animate-fade-in relative"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[28px] leading-none" role="img" aria-label="notebook">
                      📓
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="size-7 rounded-full flex items-center justify-center text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-container-high)] transition-all duration-200 cursor-pointer"
                          />
                        }
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[var(--bg)] border-[var(--outline)] min-w-[140px]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(nb.id);
                          }}
                          className="text-[var(--error)] focus:text-[var(--error)] gap-2 cursor-pointer"
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
                  <h3 className="text-[16px] font-medium text-[var(--text-primary)] line-clamp-2 mb-1">
                    {nb.title}
                  </h3>
                  {nb.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
                      {nb.description}
                    </p>
                  )}

                  {/* Card footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--outline-variant)]">
                    <div className="flex items-center gap-1.5">
                      {nb.sourceTypes && nb.sourceTypes.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {[...new Set(nb.sourceTypes)].slice(0, 4).map((type) => {
                            const Icon = SOURCE_TYPE_ICONS[type] ?? FileText;
                            return (
                              <div key={type} className="size-5 rounded bg-[var(--surface-container)] flex items-center justify-center">
                                <Icon className="size-2.5 text-[var(--text-secondary)]" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                          {nb.sourceCount !== undefined && nb.sourceCount > 0
                            ? `${nb.sourceCount} source${nb.sourceCount !== 1 ? 's' : ''}`
                            : 'No sources'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <Clock className="size-3" />
                      <span className="text-[12px]">Last opened {formatDate(nb.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
