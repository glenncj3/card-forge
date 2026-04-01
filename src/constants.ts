import type { CardTemplate, SheetLayout } from './types';

export const DPI = 150;

export const FONTS = [
  'Arial',
  'Georgia',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Times New Roman',
] as const;

export const DEFAULT_CARD_TEMPLATE: CardTemplate = {
  width: 2.5,
  height: 3.5,
  safeZoneInset: 0.1,
};

export const DEFAULT_SHEET_LAYOUT: SheetLayout = {
  paperSize: 'letter',
  orientation: 'portrait',
  margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  gutterH: 0.1,
  gutterV: 0.1,
  cropMarks: false,
};

export const PAPER_SIZES: Record<string, { width: number; height: number }> = {
  letter: { width: 8.5, height: 11 },
  a4: { width: 8.27, height: 11.69 },
};

export const QUANTITY_COLUMN_NAMES = ['qty', 'count', 'quantity', 'copies'];

export const MAX_ICON_SIZE = 500 * 1024; // 500KB

export const AUTOSAVE_DELAY = 300; // ms

export const MIN_FONT_SIZE = 6; // pt
