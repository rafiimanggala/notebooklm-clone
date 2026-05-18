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
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-2xl max-h-[80vh] flex flex-col rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2.5 text-base font-semibold font-[family-name:var(--font-heading)]">
            <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Mic className="size-3.5 text-blue-400" />
            </div>
            Audio Overview
          </DialogTitle>
        </DialogHeader>

        {!script ? (
          /* Format selection */
          <div className="flex flex-col gap-4 py-1">
            {!hasSources && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-400 leading-relaxed">
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
                        ? 'border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/5'
                        : 'border-zinc-800/60 bg-zinc-800/40 hover:border-zinc-700/80 hover:bg-zinc-800/60'
                    } ${format.value === 'custom' ? 'col-span-2 sm:col-span-1' : ''}`}
                  >
                    <div className={`size-8 rounded-lg flex items-center justify-center mb-2.5 ${
                      selectedFormat === format.value ? 'bg-blue-500/20' : 'bg-zinc-700/50'
                    } transition-colors duration-200`}>
                      <FormatIcon className={`size-4 ${
                        selectedFormat === format.value ? 'text-blue-400' : 'text-zinc-500'
                      } transition-colors duration-200`} />
                    </div>
                    <p className="text-xs font-medium text-white mb-0.5">{format.label}</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{format.description}</p>
                  </button>
                );
              })}
            </div>

            {selectedFormat === 'custom' && (
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want the audio overview to be structured..."
                className="bg-zinc-800/60 border-zinc-700/50 text-white placeholder:text-zinc-500 resize-none rounded-xl text-sm"
                rows={3}
              />
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <DialogFooter className="bg-zinc-900/50 border-zinc-800/60">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
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
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-lg"
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
            <div className="relative bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/40">
              <div className="flex items-center gap-3">
                <button
                  className="size-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
                  title="Audio generation coming soon"
                >
                  <Play className="size-4 text-white ml-0.5" />
                </button>
                <div className="flex-1 min-w-0">
                  {/* Waveform placeholder */}
                  <div className="flex items-center gap-[2px] h-8">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-zinc-600/60"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1">Audio generation coming soon</p>
                </div>
                <Volume2 className="size-4 text-zinc-600 shrink-0" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
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
                            ? 'bg-blue-500/15 text-blue-400'
                            : 'bg-purple-500/15 text-purple-400'
                        }`}
                      >
                        {isSpeaker1 ? 'S1' : 'S2'}
                      </div>
                      <div
                        className={`flex-1 rounded-xl px-3.5 py-2.5 ${
                          isSpeaker1
                            ? 'bg-zinc-800/60'
                            : 'bg-zinc-800/30'
                        }`}
                      >
                        <p className={`text-[10px] font-semibold mb-1 ${isSpeaker1 ? 'text-blue-400' : 'text-purple-400'}`}>
                          {entry.speaker}
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="bg-zinc-900/50 border-zinc-800/60">
              <Button
                variant="ghost"
                onClick={() => setScript(null)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
              >
                Generate Another
              </Button>
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
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
