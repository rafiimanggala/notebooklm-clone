'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DataTableResult } from '@/types';

interface DataTableViewerProps {
  tables: DataTableResult[];
  onClose: () => void;
}

type SortDirection = 'asc' | 'desc' | null;
interface SortState {
  tableIndex: number;
  columnIndex: number;
  direction: SortDirection;
}

function sortRows(rows: string[][], columnIndex: number, direction: SortDirection): string[][] {
  if (direction === null) return rows;
  const sorted = [...rows].sort((a, b) => {
    const aVal = a[columnIndex] ?? '';
    const bVal = b[columnIndex] ?? '';
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    return direction === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });
  return sorted;
}

function tableToCsv(table: DataTableResult): string {
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  const headerLine = table.headers.map(escape).join(',');
  const rowLines = table.rows.map((row) => row.map(escape).join(','));
  return [headerLine, ...rowLines].join('\n');
}

export function DataTableViewer({ tables, onClose }: DataTableViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSort = useCallback((tableIndex: number, columnIndex: number) => {
    setSortState((prev) => {
      if (prev && prev.tableIndex === tableIndex && prev.columnIndex === columnIndex) {
        if (prev.direction === 'asc') return { tableIndex, columnIndex, direction: 'desc' };
        if (prev.direction === 'desc') return null;
      }
      return { tableIndex, columnIndex, direction: 'asc' };
    });
  }, []);

  const handleCopyCsv = useCallback(async (table: DataTableResult, index: number) => {
    try {
      const csv = tableToCsv(table);
      await navigator.clipboard.writeText(csv);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard may not be available
    }
  }, []);

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const q = searchQuery.toLowerCase();
    return tables.map((table) => ({
      ...table,
      rows: table.rows.filter((row) =>
        row.some((cell) => cell.toLowerCase().includes(q))
      ),
    }));
  }, [tables, searchQuery]);

  return (
    <div className="w-[500px] shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-medium text-white">Data Tables</h3>
          <span className="inline-flex items-center justify-center h-5 px-2 rounded-full bg-zinc-800 text-xs text-zinc-400 font-medium">
            {tables.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter rows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* Tables */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {filteredTables.map((table, tableIndex) => {
            const isSortingThis = sortState?.tableIndex === tableIndex;
            const sortCol = isSortingThis ? sortState!.columnIndex : -1;
            const sortDir = isSortingThis ? sortState!.direction : null;
            const displayRows = isSortingThis && sortDir
              ? sortRows(table.rows, sortCol, sortDir)
              : table.rows;

            return (
              <div key={tableIndex} className="space-y-2">
                {/* Table title + copy */}
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold text-white">{table.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleCopyCsv(tables[tableIndex], tableIndex)}
                    className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                  >
                    {copiedIndex === tableIndex ? (
                      <Check className="size-3 text-green-400" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-800">
                        {table.headers.map((header, colIndex) => (
                          <th
                            key={colIndex}
                            onClick={() => handleSort(tableIndex, colIndex)}
                            className="px-3 py-2 text-[13px] font-medium text-zinc-300 cursor-pointer hover:text-white hover:bg-zinc-700/50 transition-colors select-none whitespace-nowrap"
                          >
                            <span className="inline-flex items-center gap-1">
                              {header}
                              {isSortingThis && sortCol === colIndex && (
                                sortDir === 'asc'
                                  ? <ChevronUp className="size-3 text-blue-400" />
                                  : <ChevronDown className="size-3 text-blue-400" />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={table.headers.length}
                            className="px-3 py-6 text-center text-xs text-zinc-600"
                          >
                            No matching rows
                          </td>
                        </tr>
                      ) : (
                        displayRows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={`border-t border-zinc-800 ${
                              rowIndex % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/60'
                            } hover:bg-zinc-800/40 transition-colors`}
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-3 py-2 text-[13px] text-zinc-300 whitespace-nowrap"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Row count */}
                <p className="text-[10px] text-zinc-600">
                  {displayRows.length} row{displayRows.length !== 1 ? 's' : ''}
                  {searchQuery.trim() && ` (filtered from ${tables[tableIndex].rows.length})`}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
