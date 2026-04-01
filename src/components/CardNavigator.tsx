import React from 'react';
import useStore from '../store/useStore';

const CardNavigator: React.FC = () => {
  const currentCardIndex = useStore((s) => s.currentCardIndex);
  const csvData = useStore((s) => s.project.csvData);
  const quantityColumn = useStore((s) => s.project.quantityColumn);
  const setCurrentCardIndex = useStore((s) => s.setCurrentCardIndex);

  const total = csvData.length;

  if (total === 0) {
    return (
      <div className="card-navigator">
        <span className="card-navigator-label">No cards loaded</span>
      </div>
    );
  }

  const currentRow = csvData[currentCardIndex];
  const quantity =
    quantityColumn && currentRow
      ? parseInt(currentRow[quantityColumn] || '1', 10) || 1
      : null;

  const canGoLeft = currentCardIndex > 0;
  const canGoRight = currentCardIndex < total - 1;

  return (
    <div className="card-navigator">
      <button
        className="card-navigator-btn"
        disabled={!canGoLeft}
        onClick={() => setCurrentCardIndex(currentCardIndex - 1)}
        aria-label="Previous card"
      >
        &#9664;
      </button>

      <span className="card-navigator-label">
        Card {currentCardIndex + 1} of {total}
        {quantity !== null && quantity > 1 && (
          <span className="card-navigator-qty">&times;{quantity}</span>
        )}
      </span>

      <button
        className="card-navigator-btn"
        disabled={!canGoRight}
        onClick={() => setCurrentCardIndex(currentCardIndex + 1)}
        aria-label="Next card"
      >
        &#9654;
      </button>
    </div>
  );
};

export default CardNavigator;
