import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import {
  saveProject,
  listProjects,
  deleteProject,
  exportProject,
  importProject,
} from '../utils/storage';

export default function SaveLoadDialog() {
  const project = useStore((s) => s.project);
  const setProject = useStore((s) => s.setProject);
  const setShowSaveLoad = useStore((s) => s.setShowSaveLoad);
  const loadFromStorage = useStore((s) => s.loadFromStorage);
  const setSavedStatus = useStore((s) => s.setSavedStatus);

  const [saveName, setSaveName] = useState(project.name);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  const refreshProjects = () => {
    const list = listProjects().filter((p) => p.id !== '__autosave');
    setProjects(list);
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const handleSave = () => {
    const trimmed = saveName.trim();
    if (!trimmed) return;

    saveProject(trimmed, { ...project, name: trimmed });
    setSavedStatus('saved');
    setSaveMessage(`Saved as "${trimmed}"`);
    refreshProjects();
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleLoad = (projectId: string) => {
    loadFromStorage(projectId);
    setShowSaveLoad(false);
  };

  const handleDelete = (projectId: string) => {
    if (confirmDeleteId === projectId) {
      deleteProject(projectId);
      setConfirmDeleteId(null);
      refreshProjects();
    } else {
      setConfirmDeleteId(projectId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleExport = () => {
    exportProject(project);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProject(file);
      setProject(imported);
      setShowSaveLoad(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import file');
    }

    // Reset input so the same file can be selected again
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setShowSaveLoad(false);
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-dialog modal-dialog--save-load" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Save / Load Project</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Save As */}
          <section className="save-load__section">
            <h3 className="save-load__section-title">Save As</h3>
            <div className="save-load__save-row">
              <input
                type="text"
                className="save-load__name-input"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Project name"
              />
              <button
                className="modal-btn modal-btn--primary"
                onClick={handleSave}
                disabled={!saveName.trim()}
              >
                Save
              </button>
            </div>
            {saveMessage && (
              <div className="save-load__save-message">{saveMessage}</div>
            )}
          </section>

          {/* Load */}
          <section className="save-load__section">
            <h3 className="save-load__section-title">Load</h3>
            {projects.length === 0 ? (
              <div className="save-load__no-projects">
                No saved projects found.
              </div>
            ) : (
              <ul className="save-load__project-list">
                {projects.map((p) => (
                  <li key={p.id} className="save-load__project-item">
                    <span className="save-load__project-name">{p.name}</span>
                    <div className="save-load__project-actions">
                      <button
                        className="modal-btn modal-btn--primary modal-btn--sm"
                        onClick={() => handleLoad(p.id)}
                      >
                        Load
                      </button>
                      <button
                        className={`modal-btn modal-btn--danger modal-btn--sm ${
                          confirmDeleteId === p.id ? 'modal-btn--confirm' : ''
                        }`}
                        onClick={() => handleDelete(p.id)}
                      >
                        {confirmDeleteId === p.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Export / Import */}
          <section className="save-load__section">
            <h3 className="save-load__section-title">Export / Import</h3>
            <div className="save-load__export-row">
              <button className="modal-btn modal-btn--secondary" onClick={handleExport}>
                Export .cardforge.json
              </button>
              <label className="modal-btn modal-btn--secondary save-load__import-label">
                Import .cardforge.json
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".cardforge.json,.json"
                  className="save-load__import-input"
                  onChange={handleImport}
                />
              </label>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
