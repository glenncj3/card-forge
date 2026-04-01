import { useRef } from 'react';
import useStore from '../store/useStore';
import { importProject } from '../utils/storage';

export default function WelcomeScreen() {
  const setShowCsvUpload = useStore((s) => s.setShowCsvUpload);
  const setShowSaveLoad = useStore((s) => s.setShowSaveLoad);
  const setProject = useStore((s) => s.setProject);

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProject(file);
      setProject(imported);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import file');
    }

    // Reset input so the same file can be selected again
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-screen__card">
        <h1 className="welcome-screen__title">CardForge</h1>
        <p className="welcome-screen__subtitle">
          Browser-based card game prototyping tool
        </p>
        <p className="welcome-screen__description">
          Upload a CSV to start building card prototypes
        </p>

        <div className="welcome-screen__actions">
          <button
            className="welcome-screen__btn welcome-screen__btn--primary"
            onClick={() => setShowCsvUpload(true)}
          >
            Upload CSV
          </button>

          <button
            className="welcome-screen__btn welcome-screen__btn--secondary"
            onClick={() => setShowSaveLoad(true)}
          >
            Load Project
          </button>

          <label className="welcome-screen__btn welcome-screen__btn--secondary welcome-screen__import-label">
            Import .cardforge.json
            <input
              ref={importInputRef}
              type="file"
              accept=".cardforge.json,.json"
              className="welcome-screen__import-input"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
