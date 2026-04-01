export interface ProjectIcon {
  id: string;
  label: string;
  src: string; // data URL
  aspectRatio: number;
}

export interface CardTemplate {
  width: number;  // inches
  height: number; // inches
  safeZoneInset: number; // inches
}

export interface SheetLayout {
  paperSize: 'letter' | 'a4' | 'custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  gutterH: number;
  gutterV: number;
  cropMarks: boolean;
}

export type ConditionOperator =
  | 'is' | 'is_not'
  | 'contains' | 'not_contains'
  | 'is_empty' | 'is_not_empty'
  | 'gt' | 'lt';

export interface Condition {
  id: string;
  header: string;
  operator: ConditionOperator;
  value: string;
}

export interface ShapeElement {
  id: string;
  type: 'rectangle' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
  zIndex: number;
}

export interface TextElement {
  id: string;
  type: 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  textColor: string;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  autoShrink: boolean;
  wrapText: boolean;
  zIndex: number;
}

export interface IconElement {
  id: string;
  type: 'icon';
  iconId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  preserveAspect: boolean;
  zIndex: number;
}

export type CardElement = ShapeElement | TextElement | IconElement;

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  collapsed: boolean;
  conditionMode: 'always' | 'all' | 'any';
  conditions: Condition[];
  elements: CardElement[];
}

export interface Project {
  id: string;
  name: string;
  csvHeaders: string[];
  csvData: Record<string, string>[];
  quantityColumn: string | null;
  icons: ProjectIcon[];
  cardTemplate: CardTemplate;
  sheetLayout: SheetLayout;
  rules: Rule[];
}

export type ViewMode = 'design' | 'print';

export interface SelectedElement {
  ruleId: string;
  elementId: string;
}
