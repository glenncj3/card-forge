import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Project, Rule, Condition, CardElement, ShapeElement, TextElement, IconElement,
  CardTemplate, SheetLayout, ProjectIcon, SelectedElement, ViewMode,
} from '../types';
import { DEFAULT_CARD_TEMPLATE, DEFAULT_SHEET_LAYOUT } from '../constants';
import { saveProject, loadProject, listProjects } from '../utils/storage';

function createDefaultProject(name = 'Untitled Project'): Project {
  return {
    id: uuid(),
    name,
    csvHeaders: [],
    csvData: [],
    quantityColumn: null,
    icons: [],
    cardTemplate: { ...DEFAULT_CARD_TEMPLATE },
    sheetLayout: { ...DEFAULT_SHEET_LAYOUT },
    rules: [],
  };
}

interface AppState {
  project: Project;
  currentCardIndex: number;
  selectedElement: SelectedElement | null;
  viewMode: ViewMode;
  selectedCardIds: Set<string>; // for print selection — stores row indices as strings
  savedStatus: 'saved' | 'unsaved' | 'saving';
  showCsvUpload: boolean;
  showCsvRemap: boolean;
  showSaveLoad: boolean;
  showIconManager: boolean;
  pendingCsvHeaders: string[];
  pendingCsvData: Record<string, string>[];

  // Project actions
  setProject: (project: Project) => void;
  setProjectName: (name: string) => void;
  newProject: () => void;

  // CSV actions
  setCsvData: (headers: string[], data: Record<string, string>[], quantityColumn: string | null) => void;
  setQuantityColumn: (col: string | null) => void;
  setPendingCsv: (headers: string[], data: Record<string, string>[]) => void;
  applyHeaderMapping: (mapping: Record<string, string>) => void;

  // Card template
  setCardTemplate: (template: Partial<CardTemplate>) => void;

  // Sheet layout
  setSheetLayout: (layout: Partial<SheetLayout>) => void;

  // Rule actions
  addRule: () => void;
  updateRule: (ruleId: string, updates: Partial<Rule>) => void;
  deleteRule: (ruleId: string) => void;
  reorderRules: (fromIndex: number, toIndex: number) => void;
  toggleRuleEnabled: (ruleId: string) => void;
  toggleRuleCollapsed: (ruleId: string) => void;

  // Condition actions
  addCondition: (ruleId: string) => void;
  updateCondition: (ruleId: string, conditionId: string, updates: Partial<Condition>) => void;
  removeCondition: (ruleId: string, conditionId: string) => void;

  // Element actions
  addElement: (ruleId: string, type: CardElement['type']) => void;
  updateElement: (ruleId: string, elementId: string, updates: Partial<CardElement>) => void;
  deleteElement: (ruleId: string, elementId: string) => void;
  reorderElements: (ruleId: string, fromIndex: number, toIndex: number) => void;

  // Icon actions
  addIcon: (icon: ProjectIcon) => void;
  removeIcon: (iconId: string) => void;

  // Navigation
  setCurrentCardIndex: (index: number) => void;
  setSelectedElement: (sel: SelectedElement | null) => void;
  setViewMode: (mode: ViewMode) => void;

  // Print selection
  toggleCardSelection: (index: number) => void;
  selectAllCards: () => void;
  deselectAllCards: () => void;

  // Dialogs
  setShowCsvUpload: (show: boolean) => void;
  setShowCsvRemap: (show: boolean) => void;
  setShowSaveLoad: (show: boolean) => void;
  setShowIconManager: (show: boolean) => void;

  // Persistence
  setSavedStatus: (status: 'saved' | 'unsaved' | 'saving') => void;
  saveToStorage: () => void;
  loadFromStorage: (projectId: string) => void;
}

const useStore = create<AppState>((set, get) => ({
  project: loadProject('__autosave') || createDefaultProject(),
  currentCardIndex: 0,
  selectedElement: null,
  viewMode: 'design',
  selectedCardIds: new Set<string>(),
  savedStatus: 'saved',
  showCsvUpload: false,
  showCsvRemap: false,
  showSaveLoad: false,
  showIconManager: false,
  pendingCsvHeaders: [],
  pendingCsvData: [],

  setProject: (project) => set({ project, savedStatus: 'unsaved', currentCardIndex: 0, selectedElement: null }),
  setProjectName: (name) => set((s) => ({ project: { ...s.project, name }, savedStatus: 'unsaved' })),
  newProject: () => set({
    project: createDefaultProject(),
    currentCardIndex: 0,
    selectedElement: null,
    savedStatus: 'unsaved',
  }),

  setCsvData: (headers, data, quantityColumn) => set((s) => ({
    project: { ...s.project, csvHeaders: headers, csvData: data, quantityColumn },
    currentCardIndex: 0,
    savedStatus: 'unsaved',
  })),

  setQuantityColumn: (col) => set((s) => ({
    project: { ...s.project, quantityColumn: col },
    savedStatus: 'unsaved',
  })),

  setPendingCsv: (headers, data) => set({
    pendingCsvHeaders: headers,
    pendingCsvData: data,
  }),

  applyHeaderMapping: (mapping) => set((s) => {
    const newRules = s.project.rules.map((rule) => ({
      ...rule,
      conditions: rule.conditions.map((c) => ({
        ...c,
        header: mapping[c.header] || c.header,
      })),
      elements: rule.elements.map((el) => {
        if (el.type === 'text') {
          let content = (el as TextElement).content;
          for (const [oldH, newH] of Object.entries(mapping)) {
            if (oldH !== newH) {
              content = content.replace(new RegExp(`\\{${escapeRegex(oldH)}\\}`, 'g'), `{${newH}}`);
            }
          }
          return { ...el, content } as TextElement;
        }
        return el;
      }),
    }));
    return {
      project: {
        ...s.project,
        csvHeaders: s.pendingCsvHeaders,
        csvData: s.pendingCsvData,
        rules: newRules,
      },
      pendingCsvHeaders: [],
      pendingCsvData: [],
      currentCardIndex: 0,
      savedStatus: 'unsaved',
      showCsvRemap: false,
    };
  }),

  setCardTemplate: (template) => set((s) => ({
    project: { ...s.project, cardTemplate: { ...s.project.cardTemplate, ...template } },
    savedStatus: 'unsaved',
  })),

  setSheetLayout: (layout) => set((s) => ({
    project: { ...s.project, sheetLayout: { ...s.project.sheetLayout, ...layout } },
    savedStatus: 'unsaved',
  })),

  addRule: () => set((s) => {
    const newRule: Rule = {
      id: uuid(),
      name: `Rule ${s.project.rules.length + 1}`,
      enabled: true,
      collapsed: false,
      conditionMode: 'always',
      conditions: [],
      elements: [],
    };
    return {
      project: { ...s.project, rules: [...s.project.rules, newRule] },
      savedStatus: 'unsaved',
    };
  }),

  updateRule: (ruleId, updates) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) => r.id === ruleId ? { ...r, ...updates } : r),
    },
    savedStatus: 'unsaved',
  })),

  deleteRule: (ruleId) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.filter((r) => r.id !== ruleId),
    },
    selectedElement: s.selectedElement?.ruleId === ruleId ? null : s.selectedElement,
    savedStatus: 'unsaved',
  })),

  reorderRules: (fromIndex, toIndex) => set((s) => {
    const rules = [...s.project.rules];
    const [moved] = rules.splice(fromIndex, 1);
    rules.splice(toIndex, 0, moved);
    return { project: { ...s.project, rules }, savedStatus: 'unsaved' };
  }),

  toggleRuleEnabled: (ruleId) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    },
    savedStatus: 'unsaved',
  })),

  toggleRuleCollapsed: (ruleId) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) =>
        r.id === ruleId ? { ...r, collapsed: !r.collapsed } : r
      ),
    },
  })),

  addCondition: (ruleId) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) => {
        if (r.id !== ruleId) return r;
        const firstHeader = s.project.csvHeaders[0] || '';
        const newCondition: Condition = {
          id: uuid(),
          header: firstHeader,
          operator: 'is',
          value: '',
        };
        return {
          ...r,
          conditionMode: r.conditionMode === 'always' ? 'all' : r.conditionMode,
          conditions: [...r.conditions, newCondition],
        };
      }),
    },
    savedStatus: 'unsaved',
  })),

  updateCondition: (ruleId, conditionId, updates) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          conditions: r.conditions.map((c) =>
            c.id === conditionId ? { ...c, ...updates } : c
          ),
        };
      }),
    },
    savedStatus: 'unsaved',
  })),

  removeCondition: (ruleId, conditionId) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) => {
        if (r.id !== ruleId) return r;
        const conditions = r.conditions.filter((c) => c.id !== conditionId);
        return {
          ...r,
          conditions,
          conditionMode: conditions.length === 0 ? 'always' : r.conditionMode,
        };
      }),
    },
    savedStatus: 'unsaved',
  })),

  addElement: (ruleId, type) => set((s) => {
    const { width: cw, height: ch } = s.project.cardTemplate;
    let newElement: CardElement;
    const id = uuid();

    switch (type) {
      case 'rectangle':
        newElement = {
          id, type: 'rectangle',
          x: 0, y: 0, width: cw, height: 0.5,
          fillColor: 'none', borderColor: '#000000', borderWidth: 1,
          cornerRadius: 0, zIndex: 0,
        } as ShapeElement;
        break;
      case 'ellipse':
        newElement = {
          id, type: 'ellipse',
          x: (cw - 0.5) / 2, y: (ch - 0.5) / 2,
          width: 0.5, height: 0.5,
          fillColor: 'none', borderColor: '#000000', borderWidth: 1,
          cornerRadius: 0, zIndex: 0,
        } as ShapeElement;
        break;
      case 'text':
        newElement = {
          id, type: 'text',
          content: 'Text', x: 0, y: 0, width: cw, height: 0.3,
          fontFamily: 'Arial', fontSize: 12,
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', verticalAlign: 'top',
          textColor: '#000000', fillColor: 'none',
          borderColor: 'none', borderWidth: 0,
          autoShrink: true, wrapText: true, zIndex: 0,
        } as TextElement;
        break;
      case 'icon':
        newElement = {
          id, type: 'icon',
          iconId: s.project.icons[0]?.id || '',
          x: (cw - 0.5) / 2, y: (ch - 0.5) / 2,
          width: 0.5, height: 0.5,
          preserveAspect: true, zIndex: 0,
        } as IconElement;
        break;
      default:
        return {};
    }

    return {
      project: {
        ...s.project,
        rules: s.project.rules.map((r) => {
          if (r.id !== ruleId) return r;
          return { ...r, elements: [...r.elements, newElement] };
        }),
      },
      selectedElement: { ruleId, elementId: id },
      savedStatus: 'unsaved',
    };
  }),

  updateElement: (ruleId, elementId, updates) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          elements: r.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } as CardElement : el
          ),
        };
      }),
    },
    savedStatus: 'unsaved',
  })),

  deleteElement: (ruleId, elementId) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) => {
        if (r.id !== ruleId) return r;
        return { ...r, elements: r.elements.filter((el) => el.id !== elementId) };
      }),
    },
    selectedElement: s.selectedElement?.elementId === elementId ? null : s.selectedElement,
    savedStatus: 'unsaved',
  })),

  reorderElements: (ruleId, fromIndex, toIndex) => set((s) => ({
    project: {
      ...s.project,
      rules: s.project.rules.map((r) => {
        if (r.id !== ruleId) return r;
        const elements = [...r.elements];
        const [moved] = elements.splice(fromIndex, 1);
        elements.splice(toIndex, 0, moved);
        return { ...r, elements };
      }),
    },
    savedStatus: 'unsaved',
  })),

  addIcon: (icon) => set((s) => ({
    project: { ...s.project, icons: [...s.project.icons, icon] },
    savedStatus: 'unsaved',
  })),

  removeIcon: (iconId) => set((s) => ({
    project: {
      ...s.project,
      icons: s.project.icons.filter((i) => i.id !== iconId),
    },
    savedStatus: 'unsaved',
  })),

  setCurrentCardIndex: (index) => set({ currentCardIndex: index }),
  setSelectedElement: (sel) => set({ selectedElement: sel }),
  setViewMode: (mode) => set({ viewMode: mode, selectedElement: null }),

  toggleCardSelection: (index) => set((s) => {
    const next = new Set(s.selectedCardIds);
    const key = String(index);
    if (next.has(key)) next.delete(key); else next.add(key);
    return { selectedCardIds: next };
  }),
  selectAllCards: () => set((s) => {
    const next = new Set<string>();
    s.project.csvData.forEach((_, i) => next.add(String(i)));
    return { selectedCardIds: next };
  }),
  deselectAllCards: () => set({ selectedCardIds: new Set<string>() }),

  setShowCsvUpload: (show) => set({ showCsvUpload: show }),
  setShowCsvRemap: (show) => set({ showCsvRemap: show }),
  setShowSaveLoad: (show) => set({ showSaveLoad: show }),
  setShowIconManager: (show) => set({ showIconManager: show }),

  setSavedStatus: (status) => set({ savedStatus: status }),
  saveToStorage: () => {
    const { project } = get();
    saveProject('__autosave', project);
    set({ savedStatus: 'saved' });
  },
  loadFromStorage: (projectId) => {
    const project = loadProject(projectId);
    if (project) {
      set({ project, currentCardIndex: 0, selectedElement: null, savedStatus: 'saved' });
    }
  },
}));

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default useStore;
export { createDefaultProject, listProjects };
