'use client';

import { useState, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MindMapNode } from '@/types';

interface MindMapViewerProps {
  data: MindMapNode;
  onClose: () => void;
  onNodeClick?: (label: string) => void;
}

const BRANCH_COLORS = [
  { bg: 'bg-[#129EAF]', border: 'border-[#129EAF]', line: '#129EAF', light: 'bg-[#129EAF]/15', text: 'text-[#129EAF]' },
  { bg: 'bg-[#34A853]', border: 'border-[#34A853]', line: '#34A853', light: 'bg-[#34A853]/15', text: 'text-[#34A853]' },
  { bg: 'bg-[#9334E6]', border: 'border-[#9334E6]', line: '#9334E6', light: 'bg-[#9334E6]/15', text: 'text-[#9334E6]' },
  { bg: 'bg-[#FA903E]', border: 'border-[#FA903E]', line: '#FA903E', light: 'bg-[#FA903E]/15', text: 'text-[#FA903E]' },
  { bg: 'bg-[#E91E63]', border: 'border-[#E91E63]', line: '#E91E63', light: 'bg-[#E91E63]/15', text: 'text-[#E91E63]' },
  { bg: 'bg-[#4285F4]', border: 'border-[#4285F4]', line: '#4285F4', light: 'bg-[#4285F4]/15', text: 'text-[#4285F4]' },
];

function MindMapNodeComponent({
  node,
  colorIndex,
  depth,
  onNodeClick,
  expandedNodes,
  toggleNode,
}: {
  node: MindMapNode;
  colorIndex: number;
  depth: number;
  onNodeClick?: (label: string) => void;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
}) {
  const color = BRANCH_COLORS[colorIndex % BRANCH_COLORS.length];
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isRoot = depth === 0;
  const isBranch = depth === 1;

  return (
    <div className="flex flex-col">
      {/* Node pill */}
      <div className="flex items-center gap-1.5 group">
        {hasChildren && (
          <button
            onClick={() => toggleNode(node.id)}
            className="shrink-0 size-5 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors duration-150"
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        )}
        {!hasChildren && <div className="shrink-0 w-5" />}

        <button
          onClick={() => onNodeClick?.(node.label)}
          className={`
            inline-flex items-center px-3 py-1.5 rounded-lg border transition-all duration-200
            hover:scale-[1.03] hover:shadow-md cursor-pointer
            ${isRoot
              ? 'bg-blue-500 border-blue-500 text-white font-semibold text-sm px-5 py-2 rounded-xl'
              : isBranch
                ? `${color.bg} ${color.border} text-white font-medium text-[13px]`
                : `${color.light} ${color.border}/40 ${color.text} text-xs font-normal`
            }
          `}
        >
          {node.label}
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div
          className="ml-[10px] pl-4 mt-1 space-y-1 transition-all duration-300"
          style={{
            borderLeft: `2px solid ${color.line}`,
          }}
        >
          {node.children!.map((child, i) => (
            <MindMapNodeComponent
              key={child.id}
              node={child}
              colorIndex={depth === 0 ? i : colorIndex}
              depth={depth + 1}
              onNodeClick={onNodeClick}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function collectNodeIds(node: MindMapNode): string[] {
  const ids = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectNodeIds(child));
    }
  }
  return ids;
}

export function MindMapViewer({ data, onClose, onNodeClick }: MindMapViewerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    return new Set(collectNodeIds(data));
  });
  const [scale, setScale] = useState(1);

  const toggleNode = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.15, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.15, 0.4));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
  }, []);

  return (
    <div className="w-[500px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-medium text-white">Mind Map</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={zoomOut}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <button
            onClick={resetZoom}
            className="text-[10px] text-zinc-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={zoomIn}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ZoomIn className="size-3.5" />
          </Button>
          <div className="w-px h-4 bg-zinc-800 mx-1" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Tree content */}
      <ScrollArea className="flex-1">
        <div
          className="p-6 min-h-full"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div
            className="origin-top-left transition-transform duration-200"
            style={{ transform: `scale(${scale})` }}
          >
            <MindMapNodeComponent
              node={data}
              colorIndex={0}
              depth={0}
              onNodeClick={onNodeClick}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 text-center">
          Click a node to ask about it in chat
        </p>
      </div>
    </div>
  );
}
