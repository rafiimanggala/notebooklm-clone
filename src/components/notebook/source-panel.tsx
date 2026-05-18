'use client';

import { useState, useRef, useMemo } from 'react';
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
  Search,
  Check,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  enabledSourceIds: Set<string>;
  onSourceSelect: (source: Source) => void;
  onSourceDelete: (sourceId: string) => void;
  onSourceAdd: (source: Source) => void;
  onToggleSource: (sourceId: string) => void;
  onStudyAidRequest: (type: string) => void;
  onCollapse: () => void;
}

export function SourcePanel({
  notebookId,
  sources,
  selectedSourceId,
  enabledSourceIds,
  onSourceSelect,
  onSourceDelete,
  onSourceAdd,
  onToggleSource,
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
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase();
    return sources.filter((s) => s.title.toLowerCase().includes(q));
  }, [sources, searchQuery]);

  const allEnabled = sources.length > 0 && sources.every((s) => enabledSourceIds.has(s.id));

  function handleToggleAll() {
    if (allEnabled) {
      // Deselect all
      sources.forEach((s) => {
        if (enabledSourceIds.has(s.id)) onToggleSource(s.id);
      });
    } else {
      // Select all
      sources.forEach((s) => {
        if (!enabledSourceIds.has(s.id)) onToggleSource(s.id);
      });
    }
  }

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

  return (
    <div className="w-[280px] shrink-0 bg-zinc-900/50 border-r border-zinc-800/60 flex flex-col h-full">
      {/* Panel header */}
      <div className="p-3 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-white">Sources</span>
          <Badge className="bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800/80 text-[10px] border-none h-4 px-1.5">
            {sources.length}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-md transition-all duration-200"
                />
              }
            >
              <Plus className="size-3.5" />
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-white text-base font-semibold font-[family-name:var(--font-heading)]">
                  Add Source
                </DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="mt-1">
                <TabsList className="bg-zinc-800/80 border-zinc-700 w-full">
                  <TabsTrigger
                    value="text"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-500 text-xs"
                  >
                    <AlignLeft className="size-3 mr-1" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger
                    value="url"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-500 text-xs"
                  >
                    <Link className="size-3 mr-1" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger
                    value="youtube"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-500 text-xs"
                  >
                    <Video className="size-3 mr-1" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger
                    value="pdf"
                    className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-500 text-xs"
                  >
                    <FileText className="size-3 mr-1" />
                    PDF
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-4 space-y-3">
                  <Input
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-lg h-8 text-sm"
                  />
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your text content here..."
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 resize-none min-h-[180px] rounded-lg text-sm"
                  />
                  <DialogFooter className="bg-zinc-900/50 border-zinc-800/60">
                    <Button
                      onClick={handleAddText}
                      disabled={!textContent.trim() || uploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                    >
                      {uploading && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="url" className="mt-4 space-y-3">
                  <Input
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-lg h-8 text-sm"
                  />
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-lg h-8 text-sm"
                  />
                  <DialogFooter className="bg-zinc-900/50 border-zinc-800/60">
                    <Button
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim() || uploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                    >
                      {uploading && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="youtube" className="mt-4 space-y-3">
                  <Input
                    value={ytTitle}
                    onChange={(e) => setYtTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-lg h-8 text-sm"
                  />
                  <Input
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 rounded-lg h-8 text-sm"
                  />
                  <DialogFooter className="bg-zinc-900/50 border-zinc-800/60">
                    <Button
                      onClick={handleAddVideo}
                      disabled={!ytInput.trim() || uploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                    >
                      {uploading && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type === 'application/pdf') {
                        handleAddPdf(file);
                      }
                    }}
                    className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                      dragOver
                        ? 'border-blue-500/50 bg-blue-500/5 text-blue-400'
                        : 'border-zinc-700/50 text-zinc-500 hover:text-zinc-400 hover:border-zinc-600/50'
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <Upload className="size-6" />
                    )}
                    <span className="text-xs">
                      {uploading ? 'Uploading...' : 'Drop PDF here or click to browse'}
                    </span>
                  </button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCollapse}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800/80 rounded-md transition-all duration-200"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Search and select all */}
      {sources.length > 0 && (
        <div className="px-3 pt-2.5 pb-1.5 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-zinc-600" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sources..."
              className="w-full h-7 pl-7 pr-2.5 bg-zinc-800/60 border border-zinc-800/60 rounded-lg text-xs text-white placeholder:text-zinc-600 outline-none focus:border-zinc-700/80 transition-all duration-200"
            />
          </div>
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors duration-200 cursor-pointer px-0.5"
          >
            <div className={`size-3.5 rounded border flex items-center justify-center transition-all duration-200 ${
              allEnabled ? 'bg-blue-600 border-blue-600' : 'border-zinc-600 bg-transparent'
            }`}>
              {allEnabled && <Check className="size-2.5 text-white" />}
            </div>
            {allEnabled ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

      {/* Source list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="size-12 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-3">
                <FileText className="size-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-500 font-medium">No sources yet</p>
              <p className="text-[11px] text-zinc-600 mt-1">Add sources to get started</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredSources.map((source) => {
                const Icon = SOURCE_ICONS[source.type as SourceType] ?? FileText;
                const isSelected = selectedSourceId === source.id;
                const isEnabled = enabledSourceIds.has(source.id);

                return (
                  <div
                    key={source.id}
                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-zinc-800/80 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300'
                    }`}
                    onClick={() => onSourceSelect(source)}
                  >
                    {/* Toggle checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSource(source.id);
                      }}
                      className={`size-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isEnabled
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-zinc-600 bg-transparent hover:border-zinc-500'
                      }`}
                    >
                      {isEnabled && <Check className="size-2.5 text-white" />}
                    </button>

                    {/* Source icon */}
                    <div className="size-6 rounded-md bg-zinc-800/80 flex items-center justify-center shrink-0">
                      <Icon className="size-3 text-zinc-500" />
                    </div>

                    {/* Source info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{source.title}</p>
                      <span className="text-[10px] text-zinc-600">
                        {SOURCE_LABELS[source.type as SourceType] ?? source.type}
                      </span>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(source.id);
                      }}
                      disabled={deletingId === source.id}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-transparent transition-all duration-200 size-5"
                    >
                      {deletingId === source.id ? (
                        <Loader2 className="size-2.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-2.5" />
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
      <div className="border-t border-zinc-800/60">
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
            <GraduationCap className="size-3 text-zinc-500" />
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Study Tools</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { type: 'faq', label: 'FAQ', icon: HelpCircle },
              { type: 'study-guide', label: 'Guide', icon: BookOpen },
              { type: 'timeline', label: 'Timeline', icon: Clock },
              { type: 'briefing', label: 'Briefing', icon: FileBarChart },
              { type: 'flashcard', label: 'Cards', icon: Layers },
              { type: 'quiz', label: 'Quiz', icon: GraduationCap },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => onStudyAidRequest(type)}
                disabled={sources.length === 0}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-400 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group cursor-pointer"
              >
                <Icon className="size-3.5 group-hover:text-blue-400 transition-colors duration-200" />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
