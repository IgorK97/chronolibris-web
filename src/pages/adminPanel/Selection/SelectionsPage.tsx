// pages/SelectionsPage.tsx
import React, { useState } from 'react';
import { SelectionsList } from './SelectionsList';
import { SelectionManager } from './SelectionManager';

export const SelectionsPage: React.FC = () => {
  const [selectedSelectionId, setSelectedSelectionId] = useState<number | null>(
    null
  );

  const handleSelectSelection = (selectionId: number) => {
    setSelectedSelectionId(selectionId);
  };

  const handleBack = () => {
    setSelectedSelectionId(null);
  };

  return (
    <div>
      {selectedSelectionId ? (
        <SelectionManager
          selectionId={selectedSelectionId}
          onBack={handleBack}
        />
      ) : (
        <SelectionsList
          isAdmin={true}
          onSelectSelection={handleSelectSelection}
        />
      )}
    </div>
  );
};
