import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryMeta, ToolItem } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { ArrowRight, CornerDownLeft, Search, Sparkles, Star, Clock, X } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  tools: ToolItem[];
  categories: CategoryMeta[];
  favorites: string[];
  recents: string[];
  isRtl: boolean;
  onPickTool: (tool: ToolItem) => void;
  onPickCategory: (category: CategoryMeta) => void;
}

type Row =
  | { kind: 'tool'; tool: ToolItem; score: number }
  | { kind: 'category'; category: CategoryMeta; score: number };

/** Lightweight fuzzy scorer: exact > prefix > word-prefix > subsequence. */
function score(haystack: string, needle: string): number {
  if (!needle) return 1;
  const text = haystack.toLowerCase();
  if (text === needle) return 100;
  if (text.startsWith(needle)) return 80;
  if (text.includes(` ${needle}`)) return 65;
  if (text.includes(needle)) return 55;
  let cursor = 0;
  for (const char of needle) {
    cursor = text.indexOf(char, cursor);
    if (cursor === -1) return 0;
    cursor += 1;
  }
  return 22;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open, onClose, tools, categories, favorites, recents, isRtl, onPickTool, onPickCategory,
}) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const rows = useMemo<Row[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      const recentTools = recents
        .map((id) => tools.find((tool) => tool.id === id))
        .filter((tool): tool is ToolItem => Boolean(tool))
        .slice(0, 5);
      const starred = favorites
        .map((id) => tools.find((tool) => tool.id === id))
        .filter((tool): tool is ToolItem => Boolean(tool))
        .filter((tool) => !recentTools.some((r) => r.id === tool.id))
        .slice(0, 4);
      return [
        ...recentTools.map((tool) => ({ kind: 'tool' as const, tool, score: 100 })),
        ...starred.map((tool) => ({ kind: 'tool' as const, tool, score: 90 })),
      ];
    }

    const toolRows: Row[] = tools
      .map((tool) => {
        const best = Math.max(
          score(tool.nameFa, needle) + 6,
          score(tool.nameEn, needle) + 6,
          score(tool.id, needle),
          score(`${tool.nameFa} ${tool.nameEn} ${tool.tags.join(' ')}`, needle) - 10,
        );
        return { kind: 'tool' as const, tool, score: best };
      })
      .filter((row) => row.score > 0);

    const categoryRows: Row[] = categories
      .map((category) => ({
        kind: 'category' as const,
        category,
        score: Math.max(score(category.nameFa, needle), score(category.nameEn, needle), score(category.id, needle)) - 4,
      }))
      .filter((row) => row.score > 0);

    return [...categoryRows, ...toolRows].sort((a, b) => b.score - a.score).slice(0, 40);
  }, [query, tools, categories, favorites, recents]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCursor((prev) => Math.min(prev + 1, rows.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCursor((prev) => Math.max(prev - 1, 0));
      } else if (event.key === 'Enter') {
        const row = rows[cursor];
        if (!row) return;
        event.preventDefault();
        if (row.kind === 'tool') onPickTool(row.tool);
        else onPickCategory(row.category);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, rows, cursor, onClose, onPickTool, onPickCategory]);

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`);
    active?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <button className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} aria-label="بستن" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl animate-pop">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
          <Search className="w-4 h-4 text-cyan-300 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isRtl ? 'هر کاری می‌خواهی سریع پیدا کن… (مثلاً: PDF، درصد، QR)' : 'Search everything… (e.g. PDF, percent, QR)'}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            aria-label={isRtl ? 'جستجوی سریع' : 'Quick search'}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
            ESC
          </kbd>
          <button onClick={onClose} className="sm:hidden text-slate-400 hover:text-white" aria-label="بستن">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[58vh] overflow-y-auto p-2">
          {rows.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-slate-500" />
              {isRtl ? 'چیزی پیدا نشد — با کلمه دیگری امتحان کن' : 'Nothing found — try another keyword'}
            </div>
          )}

          {rows.map((row, index) => {
            const active = index === cursor;
            if (row.kind === 'category') {
              return (
                <button
                  key={`cat-${row.category.id}`}
                  data-index={index}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => { onPickCategory(row.category); onClose(); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${active ? 'bg-cyan-500/15 border border-cyan-400/30' : 'border border-transparent'}`}
                >
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${row.category.gradient} flex items-center justify-center text-white shrink-0`}>
                    <CategoryIcon name={row.category.icon} className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold truncate">{isRtl ? row.category.nameFa : row.category.nameEn}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{isRtl ? 'دسته‌بندی' : 'Category'}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 rtl:rotate-180" />
                </button>
              );
            }

            const category = categories.find((c) => c.id === row.tool.categoryId);
            const starred = favorites.includes(row.tool.id);
            return (
              <button
                key={`tool-${row.tool.id}`}
                data-index={index}
                onMouseEnter={() => setCursor(index)}
                onClick={() => { onPickTool(row.tool); onClose(); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${active ? 'bg-cyan-500/15 border border-cyan-400/30' : 'border border-transparent'}`}
              >
                <span className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-cyan-300 shrink-0">
                  {starred ? <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> : category ? <CategoryIcon name={category.icon} className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold truncate">{isRtl ? row.tool.nameFa : row.tool.nameEn}</span>
                  <span className="block text-[10px] text-slate-400 truncate">
                    {category ? (isRtl ? category.nameFa : category.nameEn) : ''} · {row.tool.nameEn}
                  </span>
                </span>
                {active && <CornerDownLeft className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[10px] text-slate-500">
          <span>{isRtl ? '↑ ↓ حرکت · Enter باز کردن · Esc بستن' : '↑ ↓ navigate · Enter open · Esc close'}</span>
          <span className="font-mono">{rows.length} {isRtl ? 'نتیجه' : 'results'}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
