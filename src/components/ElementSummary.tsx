import type { CardElement, TextElement, ShapeElement, IconElement } from '../types';
import useStore from '../store/useStore';

interface ElementSummaryProps {
  ruleId: string;
  element: CardElement;
}

function summarize(element: CardElement): string {
  switch (element.type) {
    case 'rectangle': {
      const el = element as ShapeElement;
      return `Rectangle ${el.width}\u00d7${el.height}in, ${el.fillColor} fill`;
    }
    case 'ellipse': {
      const el = element as ShapeElement;
      return `Ellipse ${el.width}\u00d7${el.height}in`;
    }
    case 'text': {
      const el = element as TextElement;
      const truncated =
        el.content.length > 20
          ? el.content.slice(0, 20) + '\u2026'
          : el.content;
      return `Text "${truncated}" ${el.fontSize}pt`;
    }
    case 'icon': {
      const el = element as IconElement;
      return `Icon ${el.width}\u00d7${el.height}in`;
    }
    default:
      return 'Unknown element';
  }
}

export default function ElementSummary({ ruleId, element }: ElementSummaryProps) {
  const setSelectedElement = useStore((s) => s.setSelectedElement);
  const selectedElement = useStore((s) => s.selectedElement);

  const isSelected =
    selectedElement?.ruleId === ruleId &&
    selectedElement?.elementId === element.id;

  return (
    <span
      className={`element-summary ${isSelected ? 'element-summary--selected' : ''}`}
      onClick={() => setSelectedElement({ ruleId, elementId: element.id })}
      title={summarize(element)}
    >
      {summarize(element)}
    </span>
  );
}
