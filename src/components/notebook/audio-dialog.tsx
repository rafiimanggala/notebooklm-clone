'use client';

import { useState } from 'react';
import { Mic, Loader2, Sparkles } from 'lucide-react';
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

const FORMAT_OPTIONS: { value: AudioFormat; label: string; description: string }[] = [
  {
    value: 'deep-dive',
    label: 'Deep Dive',
    description: 'An in-depth discussion exploring all key topics',
  },
  {
    value: 'briefing',
    label: 'Briefing',
    description: 'A concise summary of the main points',
  },
  {
    value: 'study-guide',
    label: 'Study Guide',
    description: 'A structured review with Q&A format',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Provide your own instructions for the overview',
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
    // Reset state after close animation
    setTimeout(() => {
      setScript(null);
      setError(null);
      setCustomPrompt('');
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mic className="size-5 text-blue-400" />
            Audio Overview
          </DialogTitle>
        </DialogHeader>

        {!script ? (
          /* Format selection */
          <div className="flex flex-col gap-4 py-2">
            {!hasSources && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-400">
                  Add sources to your notebook before generating an audio overview.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedFormat === format.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{format.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{format.description}</p>
                </button>
              ))}
            </div>

            {selectedFormat === 'custom' && (
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want the audio overview to be structured..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
                rows={3}
              />
            )}

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
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
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Generate
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Script display */
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <div className="size-2 rounded-full bg-green-500" />
              Script generated
            </div>

            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-3 pr-4">
                {script.map((entry, i) => {
                  const isSpeaker1 =
                    entry.speaker === 'Speaker 1' ||
                    entry.speaker === 'Host' ||
                    i % 2 === 0;

                  return (
                    <div
                      key={i}
                      className={`flex gap-3 ${isSpeaker1 ? '' : 'flex-row-reverse'}`}
                    >
                      <div
                        className={`shrink-0 size-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          isSpeaker1
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {isSpeaker1 ? 'S1' : 'S2'}
                      </div>
                      <div
                        className={`flex-1 rounded-lg px-3 py-2 ${
                          isSpeaker1
                            ? 'bg-zinc-800'
                            : 'bg-zinc-800/60'
                        }`}
                      >
                        <p className={`text-xs font-medium mb-1 ${isSpeaker1 ? 'text-blue-400' : 'text-purple-400'}`}>
                          {entry.speaker}
                        </p>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setScript(null)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Generate Another
              </Button>
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-500 text-white"
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
