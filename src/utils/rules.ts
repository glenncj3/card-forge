import type {
  Condition,
  Rule,
  CardElement,
  ProjectIcon,
  TextElement,
} from '../types';
import { resolveTokens } from './text';

export function evaluateCondition(
  condition: Condition,
  rowData: Record<string, string>,
): boolean {
  const fieldValue = rowData[condition.header] ?? '';
  const condValue = condition.value ?? '';

  switch (condition.operator) {
    case 'is':
      return fieldValue === condValue;
    case 'is_not':
      return fieldValue !== condValue;
    case 'contains':
      return fieldValue.toLowerCase().includes(condValue.toLowerCase());
    case 'not_contains':
      return !fieldValue.toLowerCase().includes(condValue.toLowerCase());
    case 'is_empty':
      return fieldValue.trim() === '';
    case 'is_not_empty':
      return fieldValue.trim() !== '';
    case 'gt':
      return Number(fieldValue) > Number(condValue);
    case 'lt':
      return Number(fieldValue) < Number(condValue);
    default:
      return false;
  }
}

export function evaluateRule(
  rule: Rule,
  rowData: Record<string, string>,
): boolean {
  if (!rule.enabled) return false;

  if (rule.conditionMode === 'always') return true;

  const results = rule.conditions.map((c) => evaluateCondition(c, rowData));

  if (rule.conditionMode === 'all') {
    return results.length > 0 && results.every(Boolean);
  }

  if (rule.conditionMode === 'any') {
    return results.some(Boolean);
  }

  return false;
}

function resolveElement(
  element: CardElement,
  rowData: Record<string, string>,
  icons: ProjectIcon[],
): CardElement {
  if (element.type === 'text') {
    const textEl = element as TextElement;
    return {
      ...textEl,
      content: resolveTokens(textEl.content, rowData),
    };
  }

  if (element.type === 'icon') {
    // Verify the referenced icon still exists; pass through unchanged
    const icon = icons.find((i) => i.id === element.iconId);
    if (!icon) {
      // Return element as-is; rendering layer can handle missing icons
      return { ...element };
    }
    return { ...element };
  }

  // Shape elements have no tokens to resolve
  return { ...element };
}

export function getCardElements(
  rules: Rule[],
  rowData: Record<string, string>,
  icons: ProjectIcon[],
): CardElement[] {
  const elements: CardElement[] = [];

  for (const rule of rules) {
    if (!evaluateRule(rule, rowData)) continue;
    for (const element of rule.elements) {
      elements.push(resolveElement(element, rowData, icons));
    }
  }

  return elements;
}
