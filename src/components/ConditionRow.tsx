import type { Condition, ConditionOperator } from '../types';
import useStore from '../store/useStore';

interface ConditionRowProps {
  ruleId: string;
  condition: Condition;
}

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
];

const VALUE_HIDDEN_OPERATORS: ConditionOperator[] = ['is_empty', 'is_not_empty'];

export default function ConditionRow({ ruleId, condition }: ConditionRowProps) {
  const csvHeaders = useStore((s) => s.project.csvHeaders);
  const updateCondition = useStore((s) => s.updateCondition);
  const removeCondition = useStore((s) => s.removeCondition);

  const hideValue = VALUE_HIDDEN_OPERATORS.includes(condition.operator);

  return (
    <div className="condition-row">
      <select
        className="condition-row__header"
        value={condition.header}
        onChange={(e) =>
          updateCondition(ruleId, condition.id, { header: e.target.value })
        }
      >
        {csvHeaders.length === 0 && (
          <option value="">-- no headers --</option>
        )}
        {csvHeaders.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <select
        className="condition-row__operator"
        value={condition.operator}
        onChange={(e) =>
          updateCondition(ruleId, condition.id, {
            operator: e.target.value as ConditionOperator,
          })
        }
      >
        {OPERATORS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {!hideValue && (
        <input
          className="condition-row__value"
          type="text"
          value={condition.value}
          placeholder="value"
          onChange={(e) =>
            updateCondition(ruleId, condition.id, { value: e.target.value })
          }
        />
      )}

      <button
        className="condition-row__remove"
        onClick={() => removeCondition(ruleId, condition.id)}
        title="Remove condition"
      >
        &times;
      </button>
    </div>
  );
}
