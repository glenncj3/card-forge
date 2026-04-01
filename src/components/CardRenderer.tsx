import React, { useCallback, useRef } from 'react';
import type {
  CardElement,
  ShapeElement,
  TextElement,
  IconElement,
  ProjectIcon,
  CardTemplate,
  SelectedElement,
} from '../types';
import { DPI } from '../constants';
import { getCardElements } from '../utils/rules';
import { autoShrinkFontSize, measureText } from '../utils/text';
import useStore from '../store/useStore';

interface CardRendererProps {
  rowData: Record<string, string>;
  width?: number;
  height?: number;
  interactive?: boolean;
  scale?: number;
}

function textAnchorFromAlign(align: 'left' | 'center' | 'right'): 'start' | 'middle' | 'end' {
  switch (align) {
    case 'left':
      return 'start';
    case 'center':
      return 'middle';
    case 'right':
      return 'end';
  }
}

function textXFromAlign(
  align: 'left' | 'center' | 'right',
  xPx: number,
  widthPx: number,
): number {
  switch (align) {
    case 'left':
      return xPx;
    case 'center':
      return xPx + widthPx / 2;
    case 'right':
      return xPx + widthPx;
  }
}

const CardRenderer: React.FC<CardRendererProps> = ({
  rowData,
  width: widthOverride,
  height: heightOverride,
  interactive = true,
  scale = 1,
}) => {
  const project = useStore((s) => s.project);
  const selectedElement = useStore((s) => s.selectedElement);
  const setSelectedElement = useStore((s) => s.setSelectedElement);
  const updateElement = useStore((s) => s.updateElement);
  const viewMode = useStore((s) => s.viewMode);

  const { cardTemplate, rules, icons } = project;
  const cardWidthIn = widthOverride ?? cardTemplate.width;
  const cardHeightIn = heightOverride ?? cardTemplate.height;
  const cardWidthPx = cardWidthIn * DPI;
  const cardHeightPx = cardHeightIn * DPI;

  const safeInset = cardTemplate.safeZoneInset;

  // Collect elements in rule order, then element order within rule
  const elements = getCardElements(rules, rowData, icons);

  // Build a mapping from elementId -> ruleId for interactive selection
  const elementRuleMap = useRef<Map<string, string>>(new Map());
  elementRuleMap.current.clear();
  for (const rule of rules) {
    for (const el of rule.elements) {
      elementRuleMap.current.set(el.id, rule.id);
    }
  }

  const showSafeZone = interactive && (viewMode === 'design');

  return (
    <svg
      width={cardWidthPx * scale}
      height={cardHeightPx * scale}
      viewBox={`0 0 ${cardWidthPx} ${cardHeightPx}`}
      xmlns="http://www.w3.org/2000/svg"
      className="card-renderer-svg"
      style={{ display: 'block' }}
    >
      {/* White card background */}
      <rect
        x={0}
        y={0}
        width={cardWidthPx}
        height={cardHeightPx}
        fill="#ffffff"
      />

      {/* Safe zone indicator */}
      {showSafeZone && safeInset > 0 && (
        <rect
          x={safeInset * DPI}
          y={safeInset * DPI}
          width={(cardWidthIn - safeInset * 2) * DPI}
          height={(cardHeightIn - safeInset * 2) * DPI}
          fill="none"
          stroke="#cccccc"
          strokeWidth={1}
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      )}

      {/* Render each element */}
      {elements.map((element) => (
        <ElementRenderer
          key={element.id}
          element={element}
          icons={icons}
          interactive={interactive}
          selectedElement={selectedElement}
          elementRuleMap={elementRuleMap.current}
          setSelectedElement={setSelectedElement}
          updateElement={updateElement}
          cardTemplate={cardTemplate}
        />
      ))}
    </svg>
  );
};

interface ElementRendererProps {
  element: CardElement;
  icons: ProjectIcon[];
  interactive: boolean;
  selectedElement: SelectedElement | null;
  elementRuleMap: Map<string, string>;
  setSelectedElement: (sel: SelectedElement | null) => void;
  updateElement: (ruleId: string, elementId: string, updates: Partial<CardElement>) => void;
  cardTemplate: CardTemplate;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  icons,
  interactive,
  selectedElement,
  elementRuleMap,
  setSelectedElement,
  updateElement,
  cardTemplate,
}) => {
  const groupRef = useRef<SVGGElement>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    pointerId: number;
  } | null>(null);

  const ruleId = elementRuleMap.get(element.id) ?? '';
  const isSelected =
    interactive &&
    selectedElement?.ruleId === ruleId &&
    selectedElement?.elementId === element.id;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!interactive) return;

      e.stopPropagation();
      setSelectedElement({ ruleId, elementId: element.id });

      const groupEl = groupRef.current;
      if (!groupEl) return;

      groupEl.setPointerCapture(e.pointerId);
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x,
        origY: element.y,
        pointerId: e.pointerId,
      };
    },
    [interactive, ruleId, element.id, element.x, element.y, setSelectedElement],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!dragState.current) return;
      if (e.pointerId !== dragState.current.pointerId) return;

      // Get the SVG element to account for any scale transform
      const svgEl = groupRef.current?.ownerSVGElement;
      if (!svgEl) return;

      // Compute scale factor: actual rendered size vs viewBox size
      const svgRect = svgEl.getBoundingClientRect();
      const viewBox = svgEl.viewBox.baseVal;
      const scaleX = viewBox.width / svgRect.width;
      const scaleY = viewBox.height / svgRect.height;

      const dxPx = (e.clientX - dragState.current.startX) * scaleX;
      const dyPx = (e.clientY - dragState.current.startY) * scaleY;
      const dxIn = dxPx / DPI;
      const dyIn = dyPx / DPI;

      const newX = Math.round((dragState.current.origX + dxIn) * 1000) / 1000;
      const newY = Math.round((dragState.current.origY + dyIn) * 1000) / 1000;

      updateElement(ruleId, element.id, { x: newX, y: newY });
    },
    [ruleId, element.id, updateElement],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!dragState.current) return;
      if (e.pointerId !== dragState.current.pointerId) return;

      const groupEl = groupRef.current;
      if (groupEl) {
        groupEl.releasePointerCapture(e.pointerId);
      }
      dragState.current = null;
    },
    [],
  );

  const rendered = renderElement(element, icons, cardTemplate);
  if (!rendered) return null;

  return (
    <g
      ref={groupRef}
      onPointerDown={interactive ? handlePointerDown : undefined}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerUp={interactive ? handlePointerUp : undefined}
      style={{ cursor: interactive ? 'move' : undefined }}
    >
      {rendered}

      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={element.x * DPI - 2}
          y={element.y * DPI - 2}
          width={element.width * DPI + 4}
          height={element.height * DPI + 4}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="6 3"
          pointerEvents="none"
        />
      )}
    </g>
  );
};

function renderElement(
  element: CardElement,
  icons: ProjectIcon[],
  _cardTemplate: CardTemplate,
): React.ReactNode {
  switch (element.type) {
    case 'rectangle':
      return renderRectangle(element as ShapeElement);
    case 'ellipse':
      return renderEllipse(element as ShapeElement);
    case 'text':
      return renderText(element as TextElement);
    case 'icon':
      return renderIcon(element as IconElement, icons);
    default:
      return null;
  }
}

function renderRectangle(el: ShapeElement): React.ReactNode {
  const xPx = el.x * DPI;
  const yPx = el.y * DPI;
  const wPx = el.width * DPI;
  const hPx = el.height * DPI;

  return (
    <rect
      x={xPx}
      y={yPx}
      width={wPx}
      height={hPx}
      fill={el.fillColor === 'none' ? 'transparent' : el.fillColor}
      stroke={el.borderColor === 'none' ? 'none' : el.borderColor}
      strokeWidth={el.borderWidth}
      rx={el.cornerRadius * DPI}
      ry={el.cornerRadius * DPI}
    />
  );
}

function renderEllipse(el: ShapeElement): React.ReactNode {
  const cx = (el.x + el.width / 2) * DPI;
  const cy = (el.y + el.height / 2) * DPI;
  const rx = (el.width / 2) * DPI;
  const ry = (el.height / 2) * DPI;

  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={el.fillColor === 'none' ? 'transparent' : el.fillColor}
      stroke={el.borderColor === 'none' ? 'none' : el.borderColor}
      strokeWidth={el.borderWidth}
    />
  );
}

function renderText(el: TextElement): React.ReactNode {
  const xPx = el.x * DPI;
  const yPx = el.y * DPI;
  const wPx = el.width * DPI;
  const hPx = el.height * DPI;

  // The content already has tokens resolved by getCardElements
  const text = el.content;

  // Determine font size and lines
  let fontSize = el.fontSize;
  let lines: string[];

  if (el.autoShrink) {
    const result = autoShrinkFontSize(
      text,
      el.fontFamily,
      el.fontSize,
      el.fontWeight,
      el.fontStyle,
      el.width,
      el.height,
      el.wrapText,
    );
    fontSize = result.fontSize;
    lines = result.lines;
  } else {
    const measured = measureText(
      text,
      el.fontFamily,
      fontSize,
      el.fontWeight,
      el.fontStyle,
      el.width,
      el.wrapText,
    );
    lines = measured.lines;
  }

  // Convert font size from pt to SVG px: 1pt = DPI/72 px
  const fontSizePx = (fontSize * DPI) / 72;
  const lineHeight = fontSizePx * 1.2;
  const totalTextHeight = lines.length * lineHeight;

  // Calculate text X based on alignment
  const textX = textXFromAlign(el.textAlign, xPx, wPx);
  const anchor = textAnchorFromAlign(el.textAlign);

  // Calculate starting Y based on vertical alignment
  let startY: number;
  switch (el.verticalAlign) {
    case 'top':
      startY = yPx + fontSizePx; // baseline offset
      break;
    case 'middle':
      startY = yPx + (hPx - totalTextHeight) / 2 + fontSizePx;
      break;
    case 'bottom':
      startY = yPx + hPx - totalTextHeight + fontSizePx;
      break;
    default:
      startY = yPx + fontSizePx;
  }

  const hasFill = el.fillColor && el.fillColor !== 'none';
  const hasBorder = el.borderColor && el.borderColor !== 'none' && el.borderWidth > 0;

  return (
    <>
      {/* Background rectangle behind text */}
      {(hasFill || hasBorder) && (
        <rect
          x={xPx}
          y={yPx}
          width={wPx}
          height={hPx}
          fill={hasFill ? el.fillColor : 'transparent'}
          stroke={hasBorder ? el.borderColor : 'none'}
          strokeWidth={hasBorder ? el.borderWidth : 0}
        />
      )}

      <text
        x={textX}
        y={startY}
        fontFamily={el.fontFamily}
        fontSize={fontSizePx}
        fontWeight={el.fontWeight}
        fontStyle={el.fontStyle}
        fill={el.textColor}
        textAnchor={anchor}
        dominantBaseline="auto"
      >
        {lines.map((line, i) => (
          <tspan
            key={i}
            x={textX}
            dy={i === 0 ? 0 : lineHeight}
          >
            {line || '\u00A0'}
          </tspan>
        ))}
      </text>
    </>
  );
}

function renderIcon(el: IconElement, icons: ProjectIcon[]): React.ReactNode {
  const icon = icons.find((i) => i.id === el.iconId);
  if (!icon) {
    // Render a placeholder for missing icons
    const xPx = el.x * DPI;
    const yPx = el.y * DPI;
    const wPx = el.width * DPI;
    const hPx = el.height * DPI;
    return (
      <rect
        x={xPx}
        y={yPx}
        width={wPx}
        height={hPx}
        fill="#f0f0f0"
        stroke="#cccccc"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
    );
  }

  const xPx = el.x * DPI;
  const yPx = el.y * DPI;
  const wPx = el.width * DPI;
  let hPx = el.height * DPI;

  // If preserveAspect, compute height from width and the icon's aspect ratio
  if (el.preserveAspect && icon.aspectRatio > 0) {
    hPx = wPx / icon.aspectRatio;
  }

  return (
    <image
      href={icon.src}
      x={xPx}
      y={yPx}
      width={wPx}
      height={hPx}
      preserveAspectRatio={el.preserveAspect ? 'xMidYMid meet' : 'none'}
    />
  );
}

export default CardRenderer;
