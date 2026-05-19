'use client';

import { useState } from 'react';
import {
  Mic,
  Loader2,
  Sparkles,
  Briefcase,
  BookOpen,
  Swords,
  MessageCircle,
  Play,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { AudioFormat } from '@/types';

const FORMAT_OPTIONS: {
  value: AudioFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'deep-dive',
    label: 'Deep Dive',
    description: 'An in-depth discussion exploring all key topics',
    icon: Mic,
  },
  {
    value: 'briefing',
    label: 'Briefing',
    description: 'A concise summary of the main points',
    icon: Briefcase,
  },
  {
    value: 'critique',
    label: 'The Critique',
    description: 'Critical analysis challenging key assumptions',
    icon: BookOpen,
  },
  {
    value: 'debate',
    label: 'The Debate',
    description: 'Two speakers debate opposing viewpoints',
    icon: Swords,
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Provide your own instructions for the overview',
    icon: MessageCircle,
  },
];

interface ScriptEntry {
  speaker: string;
  text: string;
}

interface AudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  hasSources: boolean;
}

export function AudioDialog({
  open,
  onOpenChange,
  notebookId,
  hasSources,
}: AudioDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('deep-dive');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState<ScriptEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setScript(null);

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: selectedFormat,
          customPrompt: selectedFormat === 'custom' ? customPrompt.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to generate audio overview');
        return;
      }

      if (data.audioOverview?.script) {
        const parsed = JSON.parse(data.audioOverview.script);
        setScript(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error('Audio generation error:', err);
      setError('Failed to generate audio overview');
    } finally {
      setGenerating(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setScript(null);
      setError(null);
      setCustomPrompt('');
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[var(--bg)] border border-[var(--outline)] text-[var(--text-primary)] sm:max-w-2xl max-h-[80vh] flex flex-col rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)] flex items-center gap-2.5 text-base font-semibold font-[family-name:var(--font-heading)]">
            <div className="size-7 rounded-lg bg-[var(--primary-container)] flex items-center justify-center">
              <Mic className="size-3.5 text-[var(--nlm-primary)]" />
            </div>
            Audio Overview
          </DialogTitle>
        </DialogHeader>

        {!script ? (
          /* Format selection */
          <div className="flex flex-col gap-4 py-1">
            {!hasSources && (
              <div className="bg-[var(--primary-container)] border border-[var(--outline)] rounded-xl p-3">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Add sources to your notebook before generating an audio overview.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((format) => {
                const FormatIcon = format.icon;
                return (
                  <button
                    key={format.value}
                    onClick={() => setSelectedFormat(format.value)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      selectedFormat === format.value
                        ? 'border-[var(--nlm-primary)] bg-[var(--primary-container)] shadow-[var(--shadow-1)]'
                        : 'border-[var(--outline)] bg-[var(--surface)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-container)]'
                    } ${format.value === 'custom' ? 'col-span-2 sm:col-span-1' : ''}`}
                  >
                    <div className={`size-8 rounded-lg flex items-center justify-center mb-2.5 ${
                      selectedFormat === format.value ? 'bg-[var(--nlm-primary)]/20' : 'bg-[var(--surface-container)]'
                    } transition-colors duration-200`}>
                      <FormatIcon className={`size-4 ${
                        selectedFormat === format.value ? 'text-[var(--nlm-primary)]' : 'text-[var(--text-secondary)]'
                      } transition-colors duration-200`} />
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] mb-0.5">{format.label}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{format.description}</p>
                  </button>
                );
              })}
            </div>

            {selectedFormat === 'custom' && (
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want the audio overview to be structured..."
                className="bg-[var(--surface)] border-[var(--outline)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none rounded-xl text-sm"
                rows={3}
              />
            )}

            {error && (
              <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl p-3">
                <p className="text-xs text-[var(--error)]">{error}</p>
              </div>
            )}

            <DialogFooter className="bg-transparent border-0">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={
                  generating ||
                  !hasSources ||
                  (selectedFormat === 'custom' && !customPrompt.trim())
                }
                className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] gap-2 rounded-full"
              >
                {generating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Generate
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Script display */
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Audio player stub */}
            <div className="relative bg-[var(--surface)] rounded-xl p-4 border border-[var(--outline)]">
              <div className="flex items-center gap-3">
                <button
                  className="size-10 rounded-full bg-[var(--nlm-primary)] hover:opacity-90 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
                  title="Audio generation coming soon"
                >
                  <Play className="size-4 text-[var(--on-primary)] ml-0.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[2px] h-8">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-[var(--outline)]"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">Audio generation coming soon</p>
                </div>
                <Volume2 className="size-4 text-[var(--text-secondary)] shrink-0" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <div className="size-1.5 rounded-full bg-green-500" />
              Script generated
            </div>

            <ScrollArea className="flex-1 max-h-[45vh]">
              <div className="space-y-2.5 pr-4">
                {script.map((entry, i) => {
                  const isSpeaker1 =
                    entry.speaker === 'Speaker 1' ||
                    entry.speaker === 'Host' ||
                    i % 2 === 0;

                  return (
                    <div
                      key={i}
                      className={`flex gap-2.5 ${isSpeaker1 ? '' : 'flex-row-reverse'}`}
                    >
                      <div
                        className={`shrink-0 size-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                          isSpeaker1
                            ? 'bg-[var(--primary-container)] text-[var(--nlm-primary)]'
                            : 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400'
                        }`}
                      >
                        {isSpeaker1 ? 'S1' : 'S2'}
                      </div>
                      <div
                        className={`flex-1 rounded-xl px-3.5 py-2.5 ${
                          isSpeaker1
                            ? 'bg-[var(--surface)]'
                            : 'bg-[var(--surface-container)]'
                        }`}
                      >
                        <p className={`text-[10px] font-semibold mb-1 ${isSpeaker1 ? 'text-[var(--nlm-primary)]' : 'text-purple-600 dark:text-purple-400'}`}>
                          {entry.speaker}
                        </p>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="bg-transparent border-0">
              <Button
                variant="ghost"
                onClick={() => setScript(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-container)] rounded-full"
              >
                Generate Another
              </Button>
              <Button
                onClick={handleClose}
                className="bg-[var(--nlm-primary)] hover:opacity-90 text-[var(--on-primary)] rounded-full"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
