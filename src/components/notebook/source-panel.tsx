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
  ChevronLeft,
  Search,
  Check,
  Layers,
  FileCode,
  Table,
  BookOpen,
  Presentation,
  ImageIcon,
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
import type { Source } from '@/types';

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  url: Globe,
  youtube: Video,
  text: AlignLeft,
  markdown: FileCode,
  csv: Table,
  docx: FileText,
  epub: BookOpen,
  pptx: Presentation,
  image: ImageIcon,
};

const SOURCE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  url: 'Website',
  youtube: 'YouTube',
  text: 'Text',
  markdown: 'Markdown',
  csv: 'CSV',
  docx: 'Word',
  epub: 'EPUB',
  pptx: 'PowerPoint',
  image: 'Image',
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
  const [mdTitle, setMdTitle] = useState('');
  const [mdContent, setMdContent] = useState('');
  const [csvTitle, setCsvTitle] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const epubInputRef = useRef<HTMLInputElement>(null);
  const pptxInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [docxDragOver, setDocxDragOver] = useState(false);
  const [epubDragOver, setEpubDragOver] = useState(false);
  const [pptxDragOver, setPptxDragOver] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);

  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase();
    return sources.filter((s) => s.title.toLowerCase().includes(q));
  }, [sources, searchQuery]);

  const allEnabled = sources.length > 0 && sources.every((s) => enabledSourceIds.has(s.id));

  function handleToggleAll() {
    if (allEnabled) {
      sources.forEach((s) => {
        if (enabledSourceIds.has(s.id)) onToggleSource(s.id);
      });
    } else {
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
    setMdTitle('');
    setMdContent('');
    setCsvTitle('');
    setCsvContent('');
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

  async function handleAddMarkdown() {
    if (!mdContent.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'markdown',
          title: mdTitle.trim() || 'Untitled Markdown',
          content: mdContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.source) {
        onSourceAdd(data.source);
        resetForm();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to add markdown source:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddCsv() {
    if (!csvContent.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'csv',
          title: csvTitle.trim() || 'Untitled CSV',
          content: csvContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.source) {
        onSourceAdd(data.source);
        resetForm();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to add CSV source:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddDocx(file: File) {
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
      console.error('Failed to upload DOCX:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddFile(file: File) {
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
      console.error('Failed to upload file:', err);
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
    <div className="w-[250px] shrink-0 bg-[var(--surface-container)] border-r border-[var(--outline)] flex flex-col h-full">
      {/* Panel header */}
      <div className="p-3 flex items-center justify-between border-b border-[var(--outline)]">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-[var(--text-secondary)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">Sources</span>
          <Badge className="bg-[var(--surface-container-high)] text-[var(--text-secondary)] hover:bg-[var(--surface-container-high)] text-[10px] border-none h-4 px-1.5">
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
                  className="text-[var(--nlm-primary)] hover:bg-[var(--primary-container)] rounded-md transition-all duration-200"
                />
              }
            >
              <Plus className="size-3.5" />
            </DialogTrigger>
            <DialogContent className="bg-[var(--bg)] border border-[var(--outline)] text-[var(--text-primary)] sm:max-w-lg rounded-[28px]">
              <DialogHeader>
                <DialogTitle className="text-[var(--text-primary)] text-base font-semibold font-[family-name:var(--font-heading)]">
                  Add Source
                </DialogTitle>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="mt-1">
                <TabsList className="bg-[var(--surface-container)] border-[var(--outline)] w-full flex-wrap h-auto gap-0.5 p-1">
                  <TabsTrigger
                    value="text"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <AlignLeft className="size-3 mr-1" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger
                    value="url"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <Link className="size-3 mr-1" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger
                    value="youtube"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <Video className="size-3 mr-1" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger
                    value="pdf"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <FileText className="size-3 mr-1" />
                    PDF
                  </TabsTrigger>
                  <TabsTrigger
                    value="markdown"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <FileCode className="size-3 mr-1" />
                    MD
                  </TabsTrigger>
                  <TabsTrigger
                    value="csv"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <Table className="size-3 mr-1" />
                    CSV
                  </TabsTrigger>
                  <TabsTrigger
                    value="docx"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <FileText className="size-3 mr-1" />
                    DOCX
                  </TabsTrigger>
                  <TabsTrigger
                    value="epub"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <BookOpen className="size-3 mr-1" />
                    EPUB
                  </TabsTrigger>
                  <TabsTrigger
                    value="pptx"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <Presentation className="size-3 mr-1" />
                    PPTX
                  </TabsTrigger>
                  <TabsTrigger
                    value="image"
                    className="flex-1 data-active:bg-[var(--primary-container)] data-active:text-[var(--nlm-primary)] text-[var(--text-secondary)] text-xs px-2 py-1"
                  >
                    <ImageIcon className="size-3 mr-1" />
                    Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-4 space-y-3">
                  <Input
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-8 text-sm"
                  />
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your text content here..."
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none min-h-[180px] rounded-lg text-sm"
                  />
                  <DialogFooter className="bg-transparent border-0">
                    <Button
                      onClick={handleAddText}
                      disabled={!textContent.trim() || uploading}
                      className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full text-sm"
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
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-8 text-sm"
                  />
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-8 text-sm"
                  />
                  <DialogFooter className="bg-transparent border-0">
                    <Button
                      onClick={handleAddUrl}
                      disabled={!urlInput.trim() || uploading}
                      className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full text-sm"
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
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-8 text-sm"
                  />
                  <Input
                    value={ytInput}
                    onChange={(e) => setYtInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-8 text-sm"
                  />
                  <DialogFooter className="bg-transparent border-0">
                    <Button
                      onClick={handleAddVideo}
                      disabled={!ytInput.trim() || uploading}
                      className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full text-sm"
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
                        ? 'border-[var(--nlm-primary)] bg-[var(--primary-container)] text-[var(--nlm-primary)]'
                        : 'border-[var(--outline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
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

                <TabsContent value="markdown" className="mt-4 space-y-3">
                  <Input
                    value={mdTitle}
                    onChange={(e) => setMdTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-8 text-sm"
                  />
                  <Textarea
                    value={mdContent}
                    onChange={(e) => setMdContent(e.target.value)}
                    placeholder="Paste your markdown content here..."
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none min-h-[180px] rounded-lg text-sm font-mono"
                  />
                  <DialogFooter className="bg-transparent border-0">
                    <Button
                      onClick={handleAddMarkdown}
                      disabled={!mdContent.trim() || uploading}
                      className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full text-sm"
                    >
                      {uploading && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="csv" className="mt-4 space-y-3">
                  <Input
                    value={csvTitle}
                    onChange={(e) => setCsvTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-lg h-8 text-sm"
                  />
                  <Textarea
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="Paste CSV data (first row = headers)..."
                    className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none min-h-[180px] rounded-lg text-sm font-mono"
                  />
                  <DialogFooter className="bg-transparent border-0">
                    <Button
                      onClick={handleAddCsv}
                      disabled={!csvContent.trim() || uploading}
                      className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full text-sm"
                    >
                      {uploading && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                      Add Source
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="docx" className="mt-4 space-y-3">
                  <input
                    ref={docxInputRef}
                    type="file"
                    accept=".docx,.doc"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddDocx(file);
                    }}
                  />
                  <button
                    onClick={() => docxInputRef.current?.click()}
                    disabled={uploading}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDocxDragOver(true);
                    }}
                    onDragLeave={() => setDocxDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDocxDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (
                        file &&
                        (file.name.endsWith('.docx') || file.name.endsWith('.doc'))
                      ) {
                        handleAddDocx(file);
                      }
                    }}
                    className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                      docxDragOver
                        ? 'border-[var(--nlm-primary)] bg-[var(--primary-container)] text-[var(--nlm-primary)]'
                        : 'border-[var(--outline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <FileText className="size-6" />
                    )}
                    <span className="text-xs">
                      {uploading ? 'Uploading...' : 'Drop Word document here or click to browse'}
                    </span>
                  </button>
                </TabsContent>

                <TabsContent value="epub" className="mt-4 space-y-3">
                  <input
                    ref={epubInputRef}
                    type="file"
                    accept=".epub"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddFile(file);
                    }}
                  />
                  <button
                    onClick={() => epubInputRef.current?.click()}
                    disabled={uploading}
                    onDragOver={(e) => { e.preventDefault(); setEpubDragOver(true); }}
                    onDragLeave={() => setEpubDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setEpubDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file?.name.endsWith('.epub')) handleAddFile(file);
                    }}
                    className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                      epubDragOver
                        ? 'border-[var(--nlm-primary)] bg-[var(--primary-container)] text-[var(--nlm-primary)]'
                        : 'border-[var(--outline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    {uploading ? <Loader2 className="size-6 animate-spin" /> : <BookOpen className="size-6" />}
                    <span className="text-xs">{uploading ? 'Uploading...' : 'Drop EPUB here or click to browse'}</span>
                  </button>
                </TabsContent>

                <TabsContent value="pptx" className="mt-4 space-y-3">
                  <input
                    ref={pptxInputRef}
                    type="file"
                    accept=".pptx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddFile(file);
                    }}
                  />
                  <button
                    onClick={() => pptxInputRef.current?.click()}
                    disabled={uploading}
                    onDragOver={(e) => { e.preventDefault(); setPptxDragOver(true); }}
                    onDragLeave={() => setPptxDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setPptxDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file?.name.endsWith('.pptx')) handleAddFile(file);
                    }}
                    className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                      pptxDragOver
                        ? 'border-[var(--nlm-primary)] bg-[var(--primary-container)] text-[var(--nlm-primary)]'
                        : 'border-[var(--outline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    {uploading ? <Loader2 className="size-6 animate-spin" /> : <Presentation className="size-6" />}
                    <span className="text-xs">{uploading ? 'Uploading...' : 'Drop PowerPoint here or click to browse'}</span>
                  </button>
                </TabsContent>

                <TabsContent value="image" className="mt-4 space-y-3">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAddFile(file);
                    }}
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                    onDragLeave={() => setImageDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setImageDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name)) handleAddFile(file);
                    }}
                    className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                      imageDragOver
                        ? 'border-[var(--nlm-primary)] bg-[var(--primary-container)] text-[var(--nlm-primary)]'
                        : 'border-[var(--outline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]'
                    }`}
                  >
                    {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImageIcon className="size-6" />}
                    <span className="text-xs">{uploading ? 'Processing image with AI...' : 'Drop image here or click to browse'}</span>
                  </button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCollapse}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container-high)] rounded-md transition-all duration-200"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Search and select all */}
      {sources.length > 0 && (
        <div className="px-3 pt-2.5 pb-1.5 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[var(--text-secondary)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sources..."
              className="w-full h-7 pl-7 pr-2.5 bg-[var(--surface)] border border-[var(--outline)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--nlm-primary)] transition-all duration-200"
            />
          </div>
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 cursor-pointer px-0.5"
          >
            <div className={`size-3.5 rounded border flex items-center justify-center transition-all duration-200 ${
              allEnabled ? 'bg-[var(--nlm-primary)] border-[var(--nlm-primary)]' : 'border-[var(--outline)] bg-transparent'
            }`}>
              {allEnabled && <Check className="size-2.5 text-[var(--on-primary)]" />}
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
              <div className="size-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-3">
                <FileText className="size-5 text-[var(--text-secondary)]" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">No sources yet</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 opacity-70">Add sources to get started</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredSources.map((source) => {
                const Icon = SOURCE_ICONS[source.type] ?? FileText;
                const isSelected = selectedSourceId === source.id;
                const isEnabled = enabledSourceIds.has(source.id);

                return (
                  <div
                    key={source.id}
                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[var(--primary-container)] text-[var(--text-primary)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-container-high)]'
                    }`}
                    onClick={() => onSourceSelect(source)}
                  >
                    {/* Source icon */}
                    <div className="size-6 rounded-md bg-[var(--surface)] flex items-center justify-center shrink-0">
                      <Icon className="size-3 text-[var(--text-secondary)]" />
                    </div>

                    {/* Source info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{source.title}</p>
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {SOURCE_LABELS[source.type] ?? source.type}
                      </span>
                    </div>

                    {/* Toggle checkbox — right side */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSource(source.id);
                      }}
                      className={`size-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isEnabled
                          ? 'bg-[var(--nlm-primary)] border-[var(--nlm-primary)]'
                          : 'border-[var(--outline)] bg-transparent hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      {isEnabled && <Check className="size-2.5 text-[var(--on-primary)]" />}
                    </button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(source.id);
                      }}
                      disabled={deletingId === source.id}
                      className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-transparent transition-all duration-200 size-5"
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
    </div>
  );
}
