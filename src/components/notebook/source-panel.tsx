'use client';

import { useState, useRef } from 'react';
import {
  FileText,
  Globe,
  Video,
  AlignLeft,
  Plus,
  Trash2,
  Upload,
  Link,
  Loader2,
  HelpCircle,
  BookOpen,
  Clock,
  FileBarChart,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Source, SourceType } from '@/types';

const SOURCE_ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  url: Globe,
  youtube: Video,
  text: AlignLeft,
};

const SOURCE_LABELS: Record<SourceType, string> = {
  pdf: 'PDF',
  url: 'URL',
  youtube: 'YouTube',
  text: 'Text',
};

interface SourcePanelProps {
  notebookId: string;
  sources: Source[];
  selectedSourceId: string | null;
  collapsed: boolean;
  onSourceSelect: (source: Source) => void;
  onSourceDelete: (sourceId: string) => void;
  onSourceAdd: (source: Source) => void;
  onStudyAidRequest: (type: 'faq' | 'study-guide' | 'timeline' | 'briefing') => void;
  onCollapse: () => void;
}

export function SourcePanel({
  notebookId,
  sources,
  selectedSourceId,
  collapsed,
  onSourceSelect,
  onSourceDelete,
  onSourceAdd,
  onStudyAidRequest,
  onCollapse,
}: SourcePanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('text');
  const [uploading, setUploading] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [ytInput, setYtInput] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setTextTitle('');
    setTextContent('');
    setUrlInput('');
    setUrlTitle('');
    setYtInput('');
    setYtTitle('');
  }

  async function handleAddText() {
    if (!textContent.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          title: textTitle.trim() || 'Untitled Text',
          content: textContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.source) {
        onSourceAdd(data.source);
        resetForm();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to add text source:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddUrl() {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          title: urlTitle.trim() || undefined,
          content: urlInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.source) {
        onSourceAdd(data.source);
        resetForm();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to add URL source:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddVideo() {
    if (!ytInput.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'youtube',
          title: ytTitle.trim() || undefined,
          content: ytInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.source) {
        onSourceAdd(data.source);
        resetForm();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to add YouTube source:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddPdf(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.source) {
        onSourceAdd(data.source);
        resetForm();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to upload PDF:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(sourceId: string) {
    setDeletingId(sourceId);
    try {
      await fetch(`/api/notebooks/${notebookId}/sources/${sourceId}`, {
        method: 'DELETE',
      });
      onSourceDelete(sourceId);
    } catch (err) {
      console.error('Failed to delete source:', err);
    } finally {
      setDeletingId(null);
    }
  }

  if (collapsed) {
    return null;
  }

  return (
    <div className="w-[280px] shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Sources</span>
          <Badge className="bg-zinc-700 text-zinc-300 hover:bg-zinc-700 text-xs">
            {sources.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                />
              }
            >
              <Plus className="size-4" />
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white">Add Source</DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="mt-2">
                <TabsList className="bg-zinc-800 border-zinc-700 w-full">
                  <TabsTrigger
                    value="text"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-400"
                  >
                    <AlignLeft className="size-3.5 mr-1.5" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger
                    value="url"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-400"
                  >
                    <Link className="size-3.5 mr-1.5" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger
                    value="youtube"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-400"
                  >
                    <Video className="size-3.5 mr-1.5" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger
                    value="pdf"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-400"
                  >
                    <FileText className="size-3.5 mr-1.5" />
                    PDF
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-4 space-y-3">
                  <Input
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your text content here..."
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none min-h-[200px]"
                  />
                  <DialogFooter>
                    <Button
                      onClick={handleAddText}
                      disabled={!textContent.trim() || uploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {uploading && <Loader2 className="size-4 animate-spin mr-1.5" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="url" className="mt-4 space-y-3">
                  <Input
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <DialogFooter>
                    <Button
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim() || uploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {uploading && <Loader2 className="size-4 animate-spin mr-1.5" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="youtube" className="mt-4 space-y-3">
                  <Input
                    value={ytTitle}
                    onChange={(e) => setYtTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Input
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <DialogFooter>
                    <Button
                      onClick={handleAddVideo}
                      disabled={!ytInput.trim() || uploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {uploading && <Loader2 className="size-4 animate-spin mr-1.5" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="pdf" className="mt-4 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddPdf(file);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-40 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-3 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="size-8 animate-spin" />
                    ) : (
                      <Upload className="size-8" />
                    )}
                    <span className="text-sm">
                      {uploading ? 'Uploading...' : 'Click to upload PDF'}
                    </span>
                  </button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCollapse}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {/* Source list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FileText className="size-8 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">No sources yet</p>
              <p className="text-xs text-zinc-600 mt-1">Add sources to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sources.map((source) => {
                const Icon = SOURCE_ICONS[source.type as SourceType] ?? FileText;
                const isSelected = selectedSourceId === source.id;

                return (
                  <div
                    key={source.id}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}
                    onClick={() => onSourceSelect(source)}
                  >
                    <Icon className="size-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{source.title}</p>
                      <Badge className="bg-zinc-700/50 text-zinc-500 hover:bg-zinc-700/50 text-[10px] mt-0.5 px-1.5 py-0">
                        {SOURCE_LABELS[source.type as SourceType] ?? source.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(source.id);
                      }}
                      disabled={deletingId === source.id}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-transparent transition-opacity"
                    >
                      {deletingId === source.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Trash2 className="size-3" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Study Guide section */}
      <div className="border-t border-zinc-800">
        <div className="p-3">
          <p className="text-xs text-zinc-500 font-medium mb-2 px-1">STUDY GUIDE</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onStudyAidRequest('faq')}
              disabled={sources.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HelpCircle className="size-3.5" />
              FAQ
            </button>
            <button
              onClick={() => onStudyAidRequest('study-guide')}
              disabled={sources.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookOpen className="size-3.5" />
              Study Guide
            </button>
            <button
              onClick={() => onStudyAidRequest('timeline')}
              disabled={sources.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Clock className="size-3.5" />
              Timeline
            </button>
            <button
              onClick={() => onStudyAidRequest('briefing')}
              disabled={sources.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileBarChart className="size-3.5" />
              Briefing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
