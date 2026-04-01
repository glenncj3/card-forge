import { useMemo } from 'react';
import useStore from '../store/useStore';
import { PAPER_SIZES } from '../constants';
import type { SheetLayout } from '../types';

export function usePaperDimensions(sheetLayout: SheetLayout) {
  return useMemo(() => {
    let w: number;
    let h: number;

    if (sheetLayout.paperSize === 'custom') {
      w = sheetLayout.customWidth ?? 8.5;
      h = sheetLayout.customHeight ?? 11;
    } else {
      const size = PAPER_SIZES[sheetLayout.paperSize];
      w = size.width;
      h = size.height;
    }

    if (sheetLayout.orientation === 'landscape') {
      [w, h] = [Math.max(w, h), Math.min(w, h)];
    } else {
      [w, h] = [Math.min(w, h), Math.max(w, h)];
    }

    return { width: w, height: h };
  }, [sheetLayout.paperSize, sheetLayout.customWidth, sheetLayout.customHeight, sheetLayout.orientation]);
}

export function useCardsPerPage(sheetLayout: SheetLayout, cardWidth: number, cardHeight: number) {
  const paperDims = usePaperDimensions(sheetLayout);
  return useMemo(() => {
    const { margins, gutterH, gutterV } = sheetLayout;
    const usableW = paperDims.width - margins.left - margins.right;
    const usableH = paperDims.height - margins.top - margins.bottom;

    const cols = Math.max(0, Math.floor((usableW + gutterH) / (cardWidth + gutterH)));
    const rows = Math.max(0, Math.floor((usableH + gutterV) / (cardHeight + gutterV)));

    return { cols, rows, total: cols * rows };
  }, [paperDims, sheetLayout, cardWidth, cardHeight]);
}

export default function SheetSetup() {
  const sheetLayout = useStore((s) => s.project.sheetLayout);
  const cardTemplate = useStore((s) => s.project.cardTemplate);
  const setSheetLayout = useStore((s) => s.setSheetLayout);

  const handleChange = (updates: Partial<SheetLayout>) => {
    setSheetLayout(updates);
  };

  const cardsPerPage = useCardsPerPage(sheetLayout, cardTemplate.width, cardTemplate.height);

  return (
    <div className="sheet-setup">
      {/* Paper Size */}
      <div className="sheet-setup__row">
        <label className="sheet-setup__label">Paper Size</label>
        <select
          className="sheet-setup__select"
          value={sheetLayout.paperSize}
          onChange={(e) =>
            handleChange({
              paperSize: e.target.value as SheetLayout['paperSize'],
            })
          }
        >
          <option value="letter">Letter (8.5 x 11 in)</option>
          <option value="a4">A4 (8.27 x 11.69 in)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Custom Dimensions */}
      {sheetLayout.paperSize === 'custom' && (
        <div className="sheet-setup__row">
          <label className="sheet-setup__label">Width (in)</label>
          <input
            className="sheet-setup__input sheet-setup__input--small"
            type="number"
            step={0.01}
            min={1}
            value={sheetLayout.customWidth ?? 8.5}
            onChange={(e) =>
              handleChange({ customWidth: parseFloat(e.target.value) || 8.5 })
            }
          />
          <label className="sheet-setup__label">Height (in)</label>
          <input
            className="sheet-setup__input sheet-setup__input--small"
            type="number"
            step={0.01}
            min={1}
            value={sheetLayout.customHeight ?? 11}
            onChange={(e) =>
              handleChange({ customHeight: parseFloat(e.target.value) || 11 })
            }
          />
        </div>
      )}

      {/* Orientation */}
      <fieldset className="sheet-setup__fieldset">
        <legend className="sheet-setup__label">Orientation</legend>
        <div className="sheet-setup__radio-group">
          <label className="sheet-setup__radio">
            <input
              type="radio"
              name="sheet-orientation"
              checked={sheetLayout.orientation === 'portrait'}
              onChange={() => handleChange({ orientation: 'portrait' })}
            />
            Portrait
          </label>
          <label className="sheet-setup__radio">
            <input
              type="radio"
              name="sheet-orientation"
              checked={sheetLayout.orientation === 'landscape'}
              onChange={() => handleChange({ orientation: 'landscape' })}
            />
            Landscape
          </label>
        </div>
      </fieldset>

      {/* Margins */}
      <div className="sheet-setup__row">
        <label className="sheet-setup__label">Margins (in)</label>
        <div className="sheet-setup__margins">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <label key={side}>
              {side.charAt(0).toUpperCase() + side.slice(1)}
              <input
                className="sheet-setup__input sheet-setup__input--tiny"
                type="number"
                step={0.01}
                min={0}
                value={sheetLayout.margins[side]}
                onChange={(e) =>
                  handleChange({
                    margins: {
                      ...sheetLayout.margins,
                      [side]: parseFloat(e.target.value) || 0,
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Gutters */}
      <div className="sheet-setup__row">
        <label className="sheet-setup__label">Gutter H (in)</label>
        <input
          className="sheet-setup__input sheet-setup__input--small"
          type="number"
          step={0.01}
          min={0}
          value={sheetLayout.gutterH}
          onChange={(e) =>
            handleChange({ gutterH: parseFloat(e.target.value) || 0 })
          }
        />
      </div>

      <div className="sheet-setup__row">
        <label className="sheet-setup__label">Gutter V (in)</label>
        <input
          className="sheet-setup__input sheet-setup__input--small"
          type="number"
          step={0.01}
          min={0}
          value={sheetLayout.gutterV}
          onChange={(e) =>
            handleChange({ gutterV: parseFloat(e.target.value) || 0 })
          }
        />
      </div>

      {/* Crop Marks */}
      <div className="sheet-setup__row">
        <label className="sheet-setup__label sheet-setup__label--checkbox">
          <input
            type="checkbox"
            checked={sheetLayout.cropMarks}
            onChange={(e) => handleChange({ cropMarks: e.target.checked })}
          />
          Crop Marks
        </label>
      </div>

      {/* Cards Per Page */}
      <div className="sheet-setup__cards-per-page">
        Cards per page: {cardsPerPage.cols} x {cardsPerPage.rows} = {cardsPerPage.total}
      </div>
    </div>
  );
}
