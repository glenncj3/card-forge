import { useState } from 'react';
import useStore from '../store/useStore';
import { exportProject } from '../utils/storage';

export default function Header() {
  const project = useStore((s) => s.project);
  const setProjectName = useStore((s) => s.setProjectName);
  const savedStatus = useStore((s) => s.savedStatus);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const setShowCsvUpload = useStore((s) => s.setShowCsvUpload);
  const setShowSaveLoad = useStore((s) => s.setShowSaveLoad);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);

  const handleNameClick = () => {
    setNameValue(project.name);
    setEditingName(true);
  };

  const handleNameBlur = () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== project.name) {
      setProjectName(trimmed);
    } else {
      setNameValue(project.name);
    }
  };

  const handleExport = () => {
    exportProject(project);
  };

  const handlePrint = () => {
    setViewMode('print');
  };

  const handleBackToDesign = () => {
    setViewMode('design');
  };

  const statusLabel =
    savedStatus === 'saved'
      ? 'Saved'
      : savedStatus === 'saving'
        ? 'Saving\u2026'
        : 'Unsaved';

  return (
    <header className="header">
      <div className="header__left">
        <span className="header__logo">CardForge</span>
      </div>

      <div className="header__center">
        {editingName ? (
          <input
            className="header__project-name-input"
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameBlur();
              if (e.key === 'Escape') {
                setNameValue(project.name);
                setEditingName(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span
            className="header__project-name"
            onClick={handleNameClick}
            title="Click to rename project"
          >
            {project.name}
          </span>
        )}

        <span
          className={`header__save-status header__save-status--${savedStatus}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="header__right">
        {viewMode === 'print' ? (
          <button
            className="header__btn"
            onClick={handleBackToDesign}
          >
            Back to Design
          </button>
        ) : (
          <>
            <button
              className="header__btn"
              onClick={() => setShowCsvUpload(true)}
            >
              Upload CSV
            </button>
            <button
              className="header__btn"
              onClick={() => setShowSaveLoad(true)}
            >
              Save/Load
            </button>
            <button className="header__btn" onClick={handleExport}>
              Export
            </button>
            <button className="header__btn" onClick={handlePrint}>
              Print
            </button>
          </>
        )}
      </div>
    </header>
  );
}
