import { useState } from 'react';
import type { Rule, CardElement } from '../types';
import useStore from '../store/useStore';
import ConditionRow from './ConditionRow';
import ElementSummary from './ElementSummary';

interface RuleCardProps {
  rule: Rule;
  index: number;
  total: number;
}

function buildSummary(rule: Rule): string {
  const conditionPart =
    rule.conditionMode === 'always'
      ? 'Always'
      : rule.conditionMode === 'all'
        ? `IF ${rule.conditions.map((c) => `${c.header} ${c.operator} ${c.value}`).join(' AND ')}`
        : `IF ${rule.conditions.map((c) => `${c.header} ${c.operator} ${c.value}`).join(' OR ')}`;
  const elementCount = rule.elements.length;
  return `${conditionPart} \u2192 ${elementCount} element${elementCount !== 1 ? 's' : ''}`;
}

export default function RuleCard({ rule, index, total }: RuleCardProps) {
  const updateRule = useStore((s) => s.updateRule);
  const deleteRule = useStore((s) => s.deleteRule);
  const toggleRuleEnabled = useStore((s) => s.toggleRuleEnabled);
  const toggleRuleCollapsed = useStore((s) => s.toggleRuleCollapsed);
  const addCondition = useStore((s) => s.addCondition);
  const addElement = useStore((s) => s.addElement);
  const deleteElement = useStore((s) => s.deleteElement);
  const reorderElements = useStore((s) => s.reorderElements);
  const reorderRules = useStore((s) => s.reorderRules);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(rule.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAddElement, setShowAddElement] = useState(false);

  const handleNameBlur = () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== rule.name) {
      updateRule(rule.id, { name: trimmed });
    } else {
      setNameValue(rule.name);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteRule(rule.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleAddElement = (type: CardElement['type']) => {
    addElement(rule.id, type);
    setShowAddElement(false);
  };

  return (
    <div className={`rule-card ${!rule.enabled ? 'rule-card--disabled' : ''}`}>
      <div className="rule-card__header">
        <button
          className="rule-card__collapse-toggle"
          onClick={() => toggleRuleCollapsed(rule.id)}
          title={rule.collapsed ? 'Expand' : 'Collapse'}
        >
          {rule.collapsed ? '\u25b6' : '\u25bc'}
        </button>

        {editingName ? (
          <input
            className="rule-card__name-input"
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameBlur();
              if (e.key === 'Escape') {
                setNameValue(rule.name);
                setEditingName(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span
            className="rule-card__name"
            onClick={() => {
              setNameValue(rule.name);
              setEditingName(true);
            }}
            title="Click to rename"
          >
            {rule.name}
          </span>
        )}

        <div className="rule-card__header-actions">
          <label className="rule-card__enabled-toggle" title="Enable/disable rule">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => toggleRuleEnabled(rule.id)}
            />
          </label>

          <button
            className="rule-card__move-btn"
            disabled={index === 0}
            onClick={() => reorderRules(index, index - 1)}
            title="Move up"
          >
            &uarr;
          </button>
          <button
            className="rule-card__move-btn"
            disabled={index === total - 1}
            onClick={() => reorderRules(index, index + 1)}
            title="Move down"
          >
            &darr;
          </button>

          <button
            className={`rule-card__delete-btn ${confirmDelete ? 'rule-card__delete-btn--confirm' : ''}`}
            onClick={handleDelete}
            title={confirmDelete ? 'Click again to confirm' : 'Delete rule'}
          >
            {confirmDelete ? 'Confirm?' : '\u00d7'}
          </button>
        </div>
      </div>

      {rule.collapsed ? (
        <div className="rule-card__summary">{buildSummary(rule)}</div>
      ) : (
        <div className="rule-card__body">
          {/* Condition Mode */}
          <div className="rule-card__condition-mode">
            <span className="rule-card__section-label">Conditions:</span>
            <label>
              <input
                type="radio"
                name={`condition-mode-${rule.id}`}
                value="always"
                checked={rule.conditionMode === 'always'}
                onChange={() => updateRule(rule.id, { conditionMode: 'always' })}
              />
              Always
            </label>
            <label>
              <input
                type="radio"
                name={`condition-mode-${rule.id}`}
                value="all"
                checked={rule.conditionMode === 'all'}
                onChange={() => updateRule(rule.id, { conditionMode: 'all' })}
              />
              Match ALL (AND)
            </label>
            <label>
              <input
                type="radio"
                name={`condition-mode-${rule.id}`}
                value="any"
                checked={rule.conditionMode === 'any'}
                onChange={() => updateRule(rule.id, { conditionMode: 'any' })}
              />
              Match ANY (OR)
            </label>
          </div>

          {/* Conditions List */}
          {rule.conditionMode !== 'always' && (
            <div className="rule-card__conditions">
              {rule.conditions.map((condition) => (
                <ConditionRow
                  key={condition.id}
                  ruleId={rule.id}
                  condition={condition}
                />
              ))}
              <button
                className="rule-card__add-condition-btn"
                onClick={() => addCondition(rule.id)}
              >
                + Add Condition
              </button>
            </div>
          )}

          {/* Elements List */}
          <div className="rule-card__elements">
            <span className="rule-card__section-label">Elements:</span>
            {rule.elements.length === 0 && (
              <div className="rule-card__no-elements">No elements yet</div>
            )}
            {rule.elements.map((element, elIdx) => (
              <div key={element.id} className="rule-card__element-row">
                <ElementSummary ruleId={rule.id} element={element} />
                <div className="rule-card__element-actions">
                  <button
                    className="rule-card__move-btn"
                    disabled={elIdx === 0}
                    onClick={() => reorderElements(rule.id, elIdx, elIdx - 1)}
                    title="Move element up"
                  >
                    &uarr;
                  </button>
                  <button
                    className="rule-card__move-btn"
                    disabled={elIdx === rule.elements.length - 1}
                    onClick={() => reorderElements(rule.id, elIdx, elIdx + 1)}
                    title="Move element down"
                  >
                    &darr;
                  </button>
                  <button
                    className="rule-card__element-delete"
                    onClick={() => deleteElement(rule.id, element.id)}
                    title="Delete element"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}

            {/* Add Element Dropdown */}
            <div className="rule-card__add-element">
              <button
                className="rule-card__add-element-btn"
                onClick={() => setShowAddElement(!showAddElement)}
              >
                + Add Element {showAddElement ? '\u25b4' : '\u25be'}
              </button>
              {showAddElement && (
                <div className="rule-card__add-element-dropdown">
                  <button onClick={() => handleAddElement('rectangle')}>
                    Rectangle
                  </button>
                  <button onClick={() => handleAddElement('ellipse')}>
                    Ellipse
                  </button>
                  <button onClick={() => handleAddElement('text')}>
                    Text
                  </button>
                  <button onClick={() => handleAddElement('icon')}>
                    Icon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
