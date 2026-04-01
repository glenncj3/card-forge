import { useEffect, useRef, useCallback } from 'react';
import useStore from './store/useStore';
import { AUTOSAVE_DELAY } from './constants';
import Header from './components/Header';
import RulePanel from './components/RulePanel';
import CardCanvas from './components/CardCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import PrintView from './components/PrintView';
import CsvUpload from './components/CsvUpload';
import CsvRemap from './components/CsvRemap';
import SaveLoadDialog from './components/SaveLoadDialog';
import IconManager from './components/IconManager';
import WelcomeScreen from './components/WelcomeScreen';
import './App.css';

function App() {
  const viewMode = useStore((s) => s.viewMode);
  const savedStatus = useStore((s) => s.savedStatus);
  const saveToStorage = useStore((s) => s.saveToStorage);
  const showCsvUpload = useStore((s) => s.showCsvUpload);
  const showCsvRemap = useStore((s) => s.showCsvRemap);
  const showSaveLoad = useStore((s) => s.showSaveLoad);
  const showIconManager = useStore((s) => s.showIconManager);
  const hasCsvData = useStore((s) => s.project.csvData.length > 0);

  // Debounced auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToStorage();
    }, AUTOSAVE_DELAY);
  }, [saveToStorage]);

  useEffect(() => {
    if (savedStatus === 'unsaved') {
      debouncedSave();
    }
  }, [savedStatus, debouncedSave]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (savedStatus === 'unsaved') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [savedStatus]);

  if (viewMode === 'print') {
    return (
      <>
        <PrintView />
        {showCsvUpload && <CsvUpload />}
        {showSaveLoad && <SaveLoadDialog />}
      </>
    );
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        {hasCsvData ? (
          <>
            <RulePanel />
            <CardCanvas />
            <PropertiesPanel />
          </>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* Modal dialogs */}
      {showCsvUpload && <CsvUpload />}
      {showCsvRemap && <CsvRemap />}
      {showSaveLoad && <SaveLoadDialog />}
      {showIconManager && <IconManager />}
    </div>
  );
}

export default App;
