import { useState } from 'react';
import useStore from '../store/useStore';
import RuleCard from './RuleCard';
import SheetSetup from './SheetSetup';

export default function RulePanel() {
  const rules = useStore((s) => s.project.rules);
  const addRule = useStore((s) => s.addRule);
  const cardTemplate = useStore((s) => s.project.cardTemplate);
  const setCardTemplate = useStore((s) => s.setCardTemplate);

  const [sheetSetupOpen, setSheetSetupOpen] = useState(false);
  const [cardSizeOpen, setCardSizeOpen] = useState(false);

  return (
    <aside className="rule-panel">
      <div className="rule-panel__top">
        <button className="rule-panel__add-rule-btn" onClick={addRule}>
          + Add Rule
        </button>
      </div>

      <div className="rule-panel__rules-list">
        {rules.length === 0 && (
          <div className="rule-panel__empty">
            No rules yet. Click "Add Rule" to get started.
          </div>
        )}
        {rules.map((rule, index) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            index={index}
            total={rules.length}
          />
        ))}
      </div>

      {/* Sheet Setup collapsible */}
      <div className="rule-panel__section">
        <button
          className="rule-panel__section-header"
          onClick={() => setSheetSetupOpen(!sheetSetupOpen)}
        >
          {sheetSetupOpen ? '\u25bc' : '\u25b6'} Sheet Setup
        </button>
        {sheetSetupOpen && (
          <div className="rule-panel__section-body">
            <SheetSetup />
          </div>
        )}
      </div>

      {/* Card Size collapsible */}
      <div className="rule-panel__section">
        <button
          className="rule-panel__section-header"
          onClick={() => setCardSizeOpen(!cardSizeOpen)}
        >
          {cardSizeOpen ? '\u25bc' : '\u25b6'} Card Size
        </button>
        {cardSizeOpen && (
          <div className="rule-panel__section-body">
            <div className="rule-panel__card-size">
              <label className="rule-panel__card-size-label">
                Width (in)
                <input
                  className="rule-panel__card-size-input"
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={cardTemplate.width}
                  onChange={(e) =>
                    setCardTemplate({
                      width: parseFloat(e.target.value) || 2.5,
                    })
                  }
                />
              </label>
              <label className="rule-panel__card-size-label">
                Height (in)
                <input
                  className="rule-panel__card-size-input"
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={cardTemplate.height}
                  onChange={(e) =>
                    setCardTemplate({
                      height: parseFloat(e.target.value) || 3.5,
                    })
                  }
                />
              </label>
              <label className="rule-panel__card-size-label">
                Safe Zone Inset (in)
                <input
                  className="rule-panel__card-size-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cardTemplate.safeZoneInset}
                  onChange={(e) =>
                    setCardTemplate({
                      safeZoneInset: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
