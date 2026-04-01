import { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import useStore from '../store/useStore';
import { FONTS } from '../constants';
import type { CardElement, ShapeElement, TextElement, IconElement } from '../types';

/* ------------------------------------------------------------------ */
/*  Color Picker Popover                                               */
/* ------------------------------------------------------------------ */

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isNone = value === 'none' || value === '' || value === 'transparent';

  return (
    <div className="prop-color">
      <label className="prop-label">{label}</label>
      <div className="prop-color-row">
        <input
          type="text"
          className="prop-input prop-input--color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="prop-color-swatch"
          style={{
            backgroundColor: isNone ? 'transparent' : value,
            backgroundImage: isNone
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
              : undefined,
            backgroundSize: isNone ? '8px 8px' : undefined,
            backgroundPosition: isNone ? '0 0, 4px 4px' : undefined,
          }}
          onClick={() => setOpen(!open)}
          aria-label={`Pick ${label}`}
        />
      </div>
      {open && (
        <div className="prop-color-popover" ref={popoverRef}>
          <HexColorPicker color={isNone ? '#ffffff' : value} onChange={onChange} />
          <button
            type="button"
            className="prop-color-none-btn"
            onClick={() => {
              onChange('none');
              setOpen(false);
            }}
          >
            None (transparent)
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Numeric Input                                                      */
/* ------------------------------------------------------------------ */

interface NumInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
}

function NumInput({ label, value, onChange, step = 0.01, min, suffix }: NumInputProps) {
  return (
    <label className="prop-field">
      <span className="prop-label">{label}{suffix ? ` (${suffix})` : ''}</span>
      <input
        type="number"
        className="prop-input"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Shape Properties                                                   */
/* ------------------------------------------------------------------ */

interface ShapePropsProps {
  ruleId: string;
  element: ShapeElement;
}

function ShapeProps({ ruleId, element }: ShapePropsProps) {
  const updateElement = useStore((s) => s.updateElement);

  const update = useCallback(
    (updates: Partial<ShapeElement>) => updateElement(ruleId, element.id, updates),
    [updateElement, ruleId, element.id],
  );

  return (
    <div className="prop-section">
      <h4 className="prop-section-title">
        {element.type === 'rectangle' ? 'Rectangle' : 'Ellipse'}
      </h4>
      <div className="prop-grid">
        <NumInput label="X" value={element.x} onChange={(v) => update({ x: v })} suffix="in" />
        <NumInput label="Y" value={element.y} onChange={(v) => update({ y: v })} suffix="in" />
        <NumInput label="Width" value={element.width} onChange={(v) => update({ width: v })} suffix="in" />
        <NumInput label="Height" value={element.height} onChange={(v) => update({ height: v })} suffix="in" />
      </div>
      <div className="prop-grid">
        <ColorPicker label="Fill Color" value={element.fillColor} onChange={(v) => update({ fillColor: v })} />
        <ColorPicker label="Border Color" value={element.borderColor} onChange={(v) => update({ borderColor: v })} />
        <NumInput label="Border Width" value={element.borderWidth} onChange={(v) => update({ borderWidth: v })} step={1} min={0} suffix="px" />
        {element.type === 'rectangle' && (
          <NumInput label="Corner Radius" value={element.cornerRadius} onChange={(v) => update({ cornerRadius: v })} step={1} min={0} suffix="px" />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Text Properties                                                    */
/* ------------------------------------------------------------------ */

interface TextPropsProps {
  ruleId: string;
  element: TextElement;
}

function TextProps({ ruleId, element }: TextPropsProps) {
  const updateElement = useStore((s) => s.updateElement);

  const update = useCallback(
    (updates: Partial<TextElement>) => updateElement(ruleId, element.id, updates),
    [updateElement, ruleId, element.id],
  );

  return (
    <div className="prop-section">
      <h4 className="prop-section-title">Text</h4>

      <label className="prop-field prop-field--wide">
        <span className="prop-label">Content</span>
        <input
          type="text"
          className="prop-input"
          value={element.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="Text or {Header} tokens"
        />
      </label>

      <div className="prop-grid">
        <NumInput label="X" value={element.x} onChange={(v) => update({ x: v })} suffix="in" />
        <NumInput label="Y" value={element.y} onChange={(v) => update({ y: v })} suffix="in" />
        <NumInput label="Width" value={element.width} onChange={(v) => update({ width: v })} suffix="in" />
        <NumInput label="Height" value={element.height} onChange={(v) => update({ height: v })} suffix="in" />
      </div>

      <div className="prop-grid">
        <label className="prop-field">
          <span className="prop-label">Font Family</span>
          <select
            className="prop-input"
            value={element.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value })}
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

        <NumInput
          label="Font Size"
          value={element.fontSize}
          onChange={(v) => update({ fontSize: v })}
          step={0.5}
          min={1}
          suffix="pt"
        />

        <label className="prop-field">
          <span className="prop-label">Weight</span>
          <button
            type="button"
            className={`prop-toggle ${element.fontWeight === 'bold' ? 'prop-toggle--active' : ''}`}
            onClick={() => update({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            <strong>B</strong>
          </button>
        </label>

        <label className="prop-field">
          <span className="prop-label">Style</span>
          <button
            type="button"
            className={`prop-toggle ${element.fontStyle === 'italic' ? 'prop-toggle--active' : ''}`}
            onClick={() => update({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
          >
            <em>I</em>
          </button>
        </label>
      </div>

      <div className="prop-grid">
        <label className="prop-field">
          <span className="prop-label">Text Align</span>
          <div className="prop-btn-group">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                type="button"
                className={`prop-btn-group-item ${element.textAlign === a ? 'prop-btn-group-item--active' : ''}`}
                onClick={() => update({ textAlign: a })}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </label>

        <label className="prop-field">
          <span className="prop-label">Vertical Align</span>
          <div className="prop-btn-group">
            {(['top', 'middle', 'bottom'] as const).map((a) => (
              <button
                key={a}
                type="button"
                className={`prop-btn-group-item ${element.verticalAlign === a ? 'prop-btn-group-item--active' : ''}`}
                onClick={() => update({ verticalAlign: a })}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="prop-grid">
        <ColorPicker label="Text Color" value={element.textColor} onChange={(v) => update({ textColor: v })} />
        <ColorPicker label="Fill Color" value={element.fillColor} onChange={(v) => update({ fillColor: v })} />
        <ColorPicker label="Border Color" value={element.borderColor} onChange={(v) => update({ borderColor: v })} />
        <NumInput label="Border Width" value={element.borderWidth} onChange={(v) => update({ borderWidth: v })} step={1} min={0} suffix="px" />
      </div>

      <div className="prop-grid">
        <label className="prop-field prop-field--checkbox">
          <input
            type="checkbox"
            checked={element.autoShrink}
            onChange={(e) => update({ autoShrink: e.target.checked })}
          />
          <span className="prop-label">Auto Shrink</span>
        </label>

        <label className="prop-field prop-field--checkbox">
          <input
            type="checkbox"
            checked={element.wrapText}
            onChange={(e) => update({ wrapText: e.target.checked })}
          />
          <span className="prop-label">Wrap Text</span>
        </label>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon Properties                                                    */
/* ------------------------------------------------------------------ */

interface IconPropsProps {
  ruleId: string;
  element: IconElement;
}

function IconProps({ ruleId, element }: IconPropsProps) {
  const updateElement = useStore((s) => s.updateElement);
  const icons = useStore((s) => s.project.icons);
  const setShowIconManager = useStore((s) => s.setShowIconManager);

  const update = useCallback(
    (updates: Partial<IconElement>) => updateElement(ruleId, element.id, updates),
    [updateElement, ruleId, element.id],
  );

  return (
    <div className="prop-section">
      <h4 className="prop-section-title">Icon</h4>

      {icons.length === 0 ? (
        <div className="prop-no-icons">
          <span>Upload icons first</span>
          <button type="button" className="prop-btn" onClick={() => setShowIconManager(true)}>
            Open Icon Manager
          </button>
        </div>
      ) : (
        <label className="prop-field">
          <span className="prop-label">Icon</span>
          <select
            className="prop-input"
            value={element.iconId}
            onChange={(e) => update({ iconId: e.target.value })}
          >
            {icons.map((icon) => (
              <option key={icon.id} value={icon.id}>{icon.label}</option>
            ))}
          </select>
        </label>
      )}

      <div className="prop-grid">
        <NumInput label="X" value={element.x} onChange={(v) => update({ x: v })} suffix="in" />
        <NumInput label="Y" value={element.y} onChange={(v) => update({ y: v })} suffix="in" />
        <NumInput label="Width" value={element.width} onChange={(v) => update({ width: v })} suffix="in" />
        <NumInput label="Height" value={element.height} onChange={(v) => update({ height: v })} suffix="in" />
      </div>

      <label className="prop-field prop-field--checkbox">
        <input
          type="checkbox"
          checked={element.preserveAspect}
          onChange={(e) => update({ preserveAspect: e.target.checked })}
        />
        <span className="prop-label">Preserve Aspect Ratio</span>
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main PropertiesPanel                                               */
/* ------------------------------------------------------------------ */

export default function PropertiesPanel() {
  const selectedElement = useStore((s) => s.selectedElement);
  const rules = useStore((s) => s.project.rules);

  let element: CardElement | null = null;
  let ruleId: string | null = null;

  if (selectedElement) {
    const rule = rules.find((r) => r.id === selectedElement.ruleId);
    if (rule) {
      const el = rule.elements.find((e) => e.id === selectedElement.elementId);
      if (el) {
        element = el;
        ruleId = rule.id;
      }
    }
  }

  if (!element || !ruleId) {
    return (
      <div className="properties-panel properties-panel--empty">
        <span className="properties-panel-placeholder">
          Select an element to edit its properties
        </span>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      {(element.type === 'rectangle' || element.type === 'ellipse') && (
        <ShapeProps ruleId={ruleId} element={element as ShapeElement} />
      )}
      {element.type === 'text' && (
        <TextProps ruleId={ruleId} element={element as TextElement} />
      )}
      {element.type === 'icon' && (
        <IconProps ruleId={ruleId} element={element as IconElement} />
      )}
    </div>
  );
}
