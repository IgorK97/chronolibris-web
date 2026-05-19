import type { TextSegment } from '@/types';

//первые слова из текста абзаца
export const extractContext = (seg: TextSegment): string => {
  let raw = '';

  if (typeof seg.c === 'string') {
    raw = seg.c;
  } else if (Array.isArray(seg.c)) {
    raw = seg.c
      .map((item): string => {
        if (typeof item === 'string') return item;
        if ('pn' in item) return '';
        return (item as { c: string }).c ?? '';
      })
      .join('');
  }

  const trimmed = raw.trim();
  if (trimmed.length <= 30) return trimmed;

  const cut = trimmed.lastIndexOf(' ', 30);
  return cut > 0 ? trimmed.slice(0, cut) : trimmed.slice(0, 30);
};
