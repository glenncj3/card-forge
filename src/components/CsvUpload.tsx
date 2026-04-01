import { useState, useRef } from 'react';
import useStore from '../store/useStore';
import { parseCsv, detectQuantityColumn } from '../utils/csv';

export default function CsvUpload() {
  const setShowCsvUpload = useStore((s) => s.setShowCsvUpload);
  const setCsvData = useStore((s) => s.setCsvData);
  const existingHeaders = useStore((s) => s.project.csvHeaders);
  const existingRules = useStore((s) => s.project.rules);
  const setPendingCsv = useStore((s) => s.setPendingCsv);
  const setShowCsvRemap = useStore((s) => s.setShowCsvRemap);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [quantityCol, setQuantityCol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const result = await parseCsv(file);
      setHeaders(result.headers);
      setData(result.data);
      setQuantityCol(detectQuantityColumn(result.headers));
      setParsed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setParsed(false);
    }
  };

  const handleImport = () => {
    if (!parsed || headers.length === 0) return;

    // Check if existing rules reference headers that need remapping
    const hasExistingHeaders = existingHeaders.length > 0;
    const hasRulesWithElements = existingRules.some((r) => r.elements.length > 0 || r.conditions.length > 0);
    const headersChanged =
      hasExistingHeaders &&
      (existingHeaders.length !== headers.length ||
        existingHeaders.some((h) => !headers.includes(h)));

    if (hasRulesWithElements && headersChanged) {
      // Show remap dialog
      setPendingCsv(headers, data);
      setShowCsvUpload(false);
      setShowCsvRemap(true);
    } else {
      setCsvData(headers, data, quantityCol);
      setShowCsvUpload(false);
    }
  };

  const handleClose = () => {
    setShowCsvUpload(false);
  };

  const previewRows = data.slice(0, 5);

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-dialog modal-dialog--csv" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Upload CSV</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="csv-upload__file-row">
            <label className="csv-upload__file-label">
              Choose CSV File
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="csv-upload__file-input"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {error && <div className="csv-upload__error">{error}</div>}

          {parsed && headers.length > 0 && (
            <>
              {/* Preview Table */}
              <div className="csv-upload__preview">
                <h3 className="csv-upload__preview-title">
                  Preview ({data.length} rows, {headers.length} columns)
                </h3>
                <div className="csv-upload__table-wrap">
                  <table className="csv-upload__table">
                    <thead>
                      <tr>
                        {headers.map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i}>
                          {headers.map((h) => (
                            <td key={h}>{row[h] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.length > 5 && (
                  <div className="csv-upload__more-rows">
                    ...and {data.length - 5} more rows
                  </div>
                )}
              </div>

              {/* Quantity Column */}
              <div className="csv-upload__quantity-row">
                <label className="csv-upload__quantity-label">
                  Quantity Column
                  <select
                    className="csv-upload__quantity-select"
                    value={quantityCol ?? ''}
                    onChange={(e) =>
                      setQuantityCol(e.target.value || null)
                    }
                  >
                    <option value="">None</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
                {quantityCol && (
                  <span className="csv-upload__quantity-detected">
                    Auto-detected
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="modal-btn modal-btn--primary"
            disabled={!parsed || headers.length === 0}
            onClick={handleImport}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
