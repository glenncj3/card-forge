import React, { useCallback } from 'react';
import useStore from '../store/useStore';
import CardRenderer from './CardRenderer';
import CardNavigator from './CardNavigator';
import './CardCanvas.css';

const CardCanvas: React.FC = () => {
  const project = useStore((s) => s.project);
  const currentCardIndex = useStore((s) => s.currentCardIndex);
  const setSelectedElement = useStore((s) => s.setSelectedElement);

  const { csvData } = project;
  const rowData: Record<string, string> =
    csvData.length > 0 && currentCardIndex < csvData.length
      ? csvData[currentCardIndex]
      : {};

  const hasData = csvData.length > 0;

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only deselect if the click was directly on the background,
      // not on a child element inside the SVG
      if (e.target === e.currentTarget) {
        setSelectedElement(null);
      }
    },
    [setSelectedElement],
  );

  return (
    <div className="card-canvas">
      <div className="card-canvas-area" onClick={handleBackgroundClick}>
        {hasData ? (
          <div className="card-canvas-card">
            <CardRenderer rowData={rowData} interactive={true} />
          </div>
        ) : (
          <div className="card-canvas-empty">
            <p>Import CSV data to preview cards</p>
          </div>
        )}
      </div>
      <CardNavigator />
    </div>
  );
};

export default CardCanvas;
