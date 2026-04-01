import { useState, useMemo } from 'react';
import useStore from '../store/useStore';
import type { TextElement } from '../types';

export default function CsvRemap() {
  const setShowCsvRemap = useStore((s) => s.setShowCsvRemap);
  const applyHeaderMapping = useStore((s) => s.applyHeaderMapping);
  const oldHeaders = useStore((s) => s.project.csvHeaders);
  const newHeaders = useStore((s) => s.pendingCsvHeaders);
  const rules = useStore((s) => s.project.rules);

  // Find all old headers that rules reference (in conditions or text tokens)
  const usedHeaders = useMemo(() => {
    const used = new Set<string>();

    for (const rule of rules) {
      for (const condition of rule.conditions) {
        if (condition.header) {
          used.add(condition.header);
        }
      }
      for (const element of rule.elements) {
        if (element.type === 'text') {
          const textEl = element as TextElement;
          const tokenRegex = /\{([^}]+)\}/g;
          let match: RegExpExecArray | null;
          while ((match = tokenRegex.exec(textEl.content)) !== null) {
            used.add(match[1]);
          }
        }
      }
    }

    return used;
  }, [rules]);

  // Auto-match old -> new by exact name
  const initialMapping: Record<string, string> = {};
  for (const oldH of oldHeaders) {
    if (newHeaders.includes(oldH)) {
      initialMapping[oldH] = oldH;
    } else {
      initialMapping[oldH] = '';
    }
  }

  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

  const handleChange = (oldHeader: string, newHeader: string) => {
    setMapping((prev) => ({ ...prev, [oldHeader]: newHeader }));
  };

  const handleApply = () => {
    // Build the final mapping: only include entries where old !== new and new is not empty
    const finalMapping: Record<string, string> = {};
    for (const [oldH, newH] of Object.entries(mapping)) {
      if (newH) {
        finalMapping[oldH] = newH;
      } else {
        // Keep old header unchanged (it just won't resolve at render time)
        finalMapping[oldH] = oldH;
      }
    }
    applyHeaderMapping(finalMapping);
  };

  const handleClose = () => {
    setShowCsvRemap(false);
  };

  const unmappedUsedHeaders = oldHeaders.filter(
    (h) => usedHeaders.has(h) && (!mapping[h] || !newHeaders.includes(mapping[h])),
  );

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-dialog modal-dialog--remap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Remap CSV Headers</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="csv-remap__description">
            The new CSV has different headers. Map old headers to new ones so
            your rules continue to work.
          </p>

          {unmappedUsedHeaders.length > 0 && (
            <div className="csv-remap__warnings">
              {unmappedUsedHeaders.map((h) => (
                <span key={h} className="csv-remap__warning-badge">
                  "{h}" is used in rules but not mapped
                </span>
              ))}
            </div>
          )}

          <div className="csv-remap__table-wrap">
            <table className="csv-remap__table">
              <thead>
                <tr>
                  <th>Old Header</th>
                  <th>New Header</th>
                  <th>Used in Rules</th>
                </tr>
              </thead>
              <tbody>
                {oldHeaders.map((oldH) => (
                  <tr
                    key={oldH}
                    className={
                      usedHeaders.has(oldH) && (!mapping[oldH] || !newHeaders.includes(mapping[oldH]))
                        ? 'csv-remap__row--warning'
                        : ''
                    }
                  >
                    <td className="csv-remap__old-header">{oldH}</td>
                    <td>
                      <select
                        className="csv-remap__select"
                        value={mapping[oldH] ?? ''}
                        onChange={(e) => handleChange(oldH, e.target.value)}
                      >
                        <option value="">-- unmapped --</option>
                        {newHeaders.map((newH) => (
                          <option key={newH} value={newH}>
                            {newH}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="csv-remap__used-cell">
                      {usedHeaders.has(oldH) ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {newHeaders.filter((h) => !Object.values(mapping).includes(h)).length > 0 && (
            <div className="csv-remap__new-headers">
              <strong>New headers not yet mapped to:</strong>{' '}
              {newHeaders
                .filter((h) => !Object.values(mapping).includes(h))
                .join(', ')}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={handleClose}>
            Cancel
          </button>
          <button className="modal-btn modal-btn--primary" onClick={handleApply}>
            Apply Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
