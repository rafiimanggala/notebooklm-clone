'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

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

interface NotebookWithCounts extends Notebook {
  sourceCount?: number;
}

export default function NotebooksPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<NotebookWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

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

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="size-6 text-blue-500" />
            <h1 className="text-xl font-semibold text-white">NotebookLM</h1>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2" />
              }
            >
              <Plus className="size-4" />
              New Notebook
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Notebook</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-zinc-400">Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="My Research Notebook"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-zinc-400">Description (optional)</label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What is this notebook about?"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
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
      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse"
                />
              ))}
            </div>
          ) : notebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="size-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                <FileText className="size-8 text-zinc-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No notebooks yet</h2>
              <p className="text-zinc-400 mb-6 max-w-md">
                Create your first notebook to start uploading sources and chatting with your documents.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
              >
                <Plus className="size-4" />
                Create Notebook
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notebooks.map((nb) => (
                <button
                  key={nb.id}
                  onClick={() => router.push(`/notebook/${nb.id}`)}
                  className="group text-left p-5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {nb.title}
                    </h3>
                    {nb.sourceCount !== undefined && nb.sourceCount > 0 && (
                      <Badge className="bg-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs shrink-0 ml-2">
                        {nb.sourceCount} source{nb.sourceCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  {nb.description && (
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      {nb.description}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 mt-auto">
                    {formatDate(nb.updatedAt)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
