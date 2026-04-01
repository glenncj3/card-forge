import { useMemo } from 'react';
import useStore from '../store/useStore';
import { PAPER_SIZES, DPI } from '../constants';
import CardRenderer from './CardRenderer';

/* ------------------------------------------------------------------ */
/*  Layout Helpers                                                     */
/* ------------------------------------------------------------------ */

function getPaperDimensions(sheetLayout: {
  paperSize: string;
  customWidth?: number;
  customHeight?: number;
  orientation: string;
}): { width: number; height: number } {
  let w: number;
  let h: number;

  if (sheetLayout.paperSize === 'custom') {
    w = sheetLayout.customWidth ?? 8.5;
    h = sheetLayout.customHeight ?? 11;
  } else {
    const size = PAPER_SIZES[sheetLayout.paperSize];
    w = size?.width ?? 8.5;
    h = size?.height ?? 11;
  }

  if (sheetLayout.orientation === 'landscape') {
    [w, h] = [Math.max(w, h), Math.min(w, h)];
  } else {
    [w, h] = [Math.min(w, h), Math.max(w, h)];
  }

  return { width: w, height: h };
}

interface PageSlot {
  row: number;
  col: number;
  xIn: number;
  yIn: number;
}

function computePageSlots(
  paperW: number,
  paperH: number,
  cardW: number,
  cardH: number,
  margins: { top: number; right: number; bottom: number; left: number },
  gutterH: number,
  gutterV: number,
): { cols: number; rows: number; slots: PageSlot[] } {
  const usableW = paperW - margins.left - margins.right;
  const usableH = paperH - margins.top - margins.bottom;

  const cols = Math.max(0, Math.floor((usableW + gutterH) / (cardW + gutterH)));
  const rows = Math.max(0, Math.floor((usableH + gutterV) / (cardH + gutterV)));

  const slots: PageSlot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        row: r,
        col: c,
        xIn: margins.left + c * (cardW + gutterH),
        yIn: margins.top + r * (cardH + gutterV),
      });
    }
  }

  return { cols, rows, slots };
}

/* ------------------------------------------------------------------ */
/*  Crop Marks Renderer                                                */
/* ------------------------------------------------------------------ */

function CropMarks({
  xIn,
  yIn,
  cardW,
  cardH,
  scale,
}: {
  xIn: number;
  yIn: number;
  cardW: number;
  cardH: number;
  scale: number;
}) {
  const markLen = 0.15 * scale; // inches -> display units at scale
  const sw = 0.5; // stroke width in px

  // Four corners, each with horizontal + vertical line
  const corners = [
    // Top-left
    { x: xIn * scale, y: yIn * scale, dx: -markLen, dy: 0 },
    { x: xIn * scale, y: yIn * scale, dx: 0, dy: -markLen },
    // Top-right
    { x: (xIn + cardW) * scale, y: yIn * scale, dx: markLen, dy: 0 },
    { x: (xIn + cardW) * scale, y: yIn * scale, dx: 0, dy: -markLen },
    // Bottom-left
    { x: xIn * scale, y: (yIn + cardH) * scale, dx: -markLen, dy: 0 },
    { x: xIn * scale, y: (yIn + cardH) * scale, dx: 0, dy: markLen },
    // Bottom-right
    { x: (xIn + cardW) * scale, y: (yIn + cardH) * scale, dx: markLen, dy: 0 },
    { x: (xIn + cardW) * scale, y: (yIn + cardH) * scale, dx: 0, dy: markLen },
  ];

  return (
    <g>
      {corners.map((c, i) => (
        <line
          key={i}
          x1={c.x}
          y1={c.y}
          x2={c.x + c.dx}
          y2={c.y + c.dy}
          stroke="#000000"
          strokeWidth={sw}
        />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Print View Component                                               */
/* ------------------------------------------------------------------ */

export default function PrintView() {
  const project = useStore((s) => s.project);
  const selectedCardIds = useStore((s) => s.selectedCardIds);
  const selectAllCards = useStore((s) => s.selectAllCards);
  const deselectAllCards = useStore((s) => s.deselectAllCards);
  const toggleCardSelection = useStore((s) => s.toggleCardSelection);
  const setViewMode = useStore((s) => s.setViewMode);

  const { csvData, quantityColumn, sheetLayout, cardTemplate } = project;

  const paperDims = getPaperDimensions(sheetLayout);
  const { cols, rows, slots } = useMemo(
    () =>
      computePageSlots(
        paperDims.width,
        paperDims.height,
        cardTemplate.width,
        cardTemplate.height,
        sheetLayout.margins,
        sheetLayout.gutterH,
        sheetLayout.gutterV,
      ),
    [paperDims, cardTemplate, sheetLayout],
  );

  const cardsPerPage = cols * rows;

  // Expand selected cards with quantities
  const selectedCards = useMemo(() => {
    const cards: { rowIndex: number; rowData: Record<string, string> }[] = [];
    csvData.forEach((row, i) => {
      if (!selectedCardIds.has(String(i))) return;
      const qty = quantityColumn ? parseInt(row[quantityColumn] || '1', 10) || 1 : 1;
      for (let q = 0; q < qty; q++) {
        cards.push({ rowIndex: i, rowData: row });
      }
    });
    return cards;
  }, [csvData, selectedCardIds, quantityColumn]);

  // Group cards into pages
  const pages = useMemo(() => {
    if (cardsPerPage === 0) return [];
    const result: { rowIndex: number; rowData: Record<string, string> }[][] = [];
    for (let i = 0; i < selectedCards.length; i += cardsPerPage) {
      result.push(selectedCards.slice(i, i + cardsPerPage));
    }
    return result;
  }, [selectedCards, cardsPerPage]);

  // Scale for page preview (fit in ~700px wide)
  const previewScale = 700 / (paperDims.width * DPI);
  const pageWidthPx = paperDims.width * DPI * previewScale;
  const pageHeightPx = paperDims.height * DPI * previewScale;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-view">
      <div className="print-view__toolbar no-print">
        <button
          className="print-view__back-btn"
          onClick={() => setViewMode('design')}
        >
          Back to Design
        </button>
        <button className="print-view__print-btn" onClick={handlePrint}>
          Print
        </button>
      </div>

      {/* Card selection panel */}
      <div className="print-view__card-selection no-print">
        <div className="print-view__selection-actions">
          <button className="print-view__select-btn" onClick={selectAllCards}>
            Select All
          </button>
          <button className="print-view__select-btn" onClick={deselectAllCards}>
            Deselect All
          </button>
          <span className="print-view__selection-count">
            {selectedCardIds.size} of {csvData.length} rows selected
            ({selectedCards.length} cards with quantities)
          </span>
        </div>
        <div className="print-view__card-grid">
          {csvData.map((row, i) => (
            <div key={i} className="print-view__card-thumb-wrapper">
              <label className="print-view__card-thumb-label">
                <input
                  type="checkbox"
                  className="print-view__card-thumb-checkbox"
                  checked={selectedCardIds.has(String(i))}
                  onChange={() => toggleCardSelection(i)}
                />
                <div className="print-view__card-thumb">
                  <CardRenderer rowData={row} scale={0.3} interactive={false} />
                </div>
                <span className="print-view__card-thumb-index">
                  #{i + 1}
                  {quantityColumn && (
                    <span className="print-view__card-thumb-qty">
                      x{parseInt(row[quantityColumn] || '1', 10) || 1}
                    </span>
                  )}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Print preview */}
      <div className="print-view__preview">
        {pages.length === 0 && (
          <div className="print-view__no-pages no-print">
            No cards selected. Select cards above to preview print layout.
          </div>
        )}
        {pages.map((pageCards, pageIdx) => (
          <div key={pageIdx} className="print-view__page-wrapper">
            <div className="print-view__page-label no-print">
              Page {pageIdx + 1} of {pages.length}
            </div>
            <svg
              className="print-view__page-svg print-page"
              width={pageWidthPx}
              height={pageHeightPx}
              viewBox={`0 0 ${paperDims.width * DPI} ${paperDims.height * DPI}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* White page background */}
              <rect
                x={0}
                y={0}
                width={paperDims.width * DPI}
                height={paperDims.height * DPI}
                fill="#ffffff"
              />

              {/* Render cards at positions */}
              {pageCards.map((card, slotIdx) => {
                if (slotIdx >= slots.length) return null;
                const slot = slots[slotIdx];
                const xPx = slot.xIn * DPI;
                const yPx = slot.yIn * DPI;

                return (
                  <g key={slotIdx} transform={`translate(${xPx}, ${yPx})`}>
                    <CardRenderer
                      rowData={card.rowData}
                      scale={1}
                      interactive={false}
                    />
                  </g>
                );
              })}

              {/* Crop marks */}
              {sheetLayout.cropMarks &&
                pageCards.map((_, slotIdx) => {
                  if (slotIdx >= slots.length) return null;
                  const slot = slots[slotIdx];
                  return (
                    <CropMarks
                      key={`crop-${slotIdx}`}
                      xIn={slot.xIn}
                      yIn={slot.yIn}
                      cardW={cardTemplate.width}
                      cardH={cardTemplate.height}
                      scale={DPI}
                    />
                  );
                })}
            </svg>
          </div>
        ))}
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print,
          .print-view__toolbar,
          .print-view__card-selection,
          .print-view__page-label,
          .print-view__no-pages {
            display: none !important;
          }
          .print-view {
            padding: 0 !important;
            background: transparent !important;
          }
          .print-view__preview {
            padding: 0 !important;
          }
          .print-view__page-wrapper {
            page-break-after: always;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-view__page-wrapper:last-child {
            page-break-after: auto;
          }
          .print-view__page-svg {
            width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
