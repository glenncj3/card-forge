import { DPI, MIN_FONT_SIZE } from '../constants';

export function resolveTokens(
  template: string,
  rowData: Record<string, string>,
): string {
  return template.replace(/\{([^}]+)\}/g, (_match, key: string) => {
    return rowData[key] ?? '';
  });
}

// Shared offscreen canvas for text measurement
let sharedCanvas: HTMLCanvasElement | null = null;

function getCanvasContext(): CanvasRenderingContext2D {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }
  const ctx = sharedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for text measurement');
  }
  return ctx;
}

function buildFontString(
  fontFamily: string,
  fontSize: number,
  fontWeight: string,
  fontStyle: string,
): string {
  // fontSize is in pt; convert to px for canvas (1pt = DPI/72 px at our render DPI)
  const fontSizePx = (fontSize * DPI) / 72;
  return `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidthPx && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export function measureText(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: string,
  fontStyle: string,
  maxWidth: number,
  wrapText: boolean,
): { width: number; height: number; lines: string[] } {
  const ctx = getCanvasContext();
  ctx.font = buildFontString(fontFamily, fontSize, fontWeight, fontStyle);

  const maxWidthPx = maxWidth * DPI;
  const lineHeightPx = (fontSize * DPI) / 72 * 1.2;

  let lines: string[];

  if (wrapText && maxWidthPx > 0) {
    lines = wrapLines(ctx, text, maxWidthPx);
  } else {
    lines = text.split('\n');
  }

  let widestLine = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line);
    if (metrics.width > widestLine) {
      widestLine = metrics.width;
    }
  }

  return {
    width: widestLine / DPI,
    height: (lines.length * lineHeightPx) / DPI,
    lines,
  };
}

export function autoShrinkFontSize(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: string,
  fontStyle: string,
  boxWidth: number,
  boxHeight: number,
  wrapText: boolean,
): { fontSize: number; lines: string[] } {
  let currentSize = fontSize;

  while (currentSize > MIN_FONT_SIZE) {
    const measured = measureText(
      text,
      fontFamily,
      currentSize,
      fontWeight,
      fontStyle,
      boxWidth,
      wrapText,
    );

    const fitsWidth =
      wrapText || measured.width <= boxWidth;
    const fitsHeight = measured.height <= boxHeight;

    if (fitsWidth && fitsHeight) {
      return { fontSize: currentSize, lines: measured.lines };
    }

    currentSize -= 0.5;
  }

  // Return at minimum font size
  const finalMeasured = measureText(
    text,
    fontFamily,
    MIN_FONT_SIZE,
    fontWeight,
    fontStyle,
    boxWidth,
    wrapText,
  );

  return { fontSize: MIN_FONT_SIZE, lines: finalMeasured.lines };
}
