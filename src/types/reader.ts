export interface PageNumberNode {
  pn: number;
}

export interface Footnote {
  t: string;
  xp: number[];
  c: string | string[];
}

export interface Note {
  t: string;
  role: string;
  xp: number[];
  c: string;
  f?: Footnote;
}

export type InlineNode = Note | { t: 'em' | 'st'; c: string } | PageNumberNode;

export interface ImgNode {
  t: 'img';
  src: string;
}

export interface TextSegment {
  t: string;
  xp?: number[];
  c: string | TextSegment[] | (string | InlineNode)[] | ImgNode[]; //широкий юнион
}

export interface TocPart {
  s: number;
  e: number;
  xps: number[];
  xpe: number[];
  url: string;
}

export interface TocBodyItem {
  s: number;
  e: number;
  t: string;
  c?: TocBodyItem[];
}

export interface TocMeta {
  Title: string;
  Authors: { Role: string; First?: string; Last?: string }[];
  Annotation: string;
  Lang: string;
}

export interface TocData {
  Meta: TocMeta;
  full_length: number;
  Body: TocBodyItem[];
  Parts: TocPart[];
}
