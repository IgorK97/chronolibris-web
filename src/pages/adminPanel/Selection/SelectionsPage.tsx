import React, { useState } from 'react';
import { SelectionsList } from './SelectionsList';
import { SelectionManager } from './SelectionManager';

type PageView =
  | { kind: 'list' }
  | { kind: 'edit'; selectionId: number }
  | { kind: 'create' };

export const SelectionsPage: React.FC = () => {
  const [view, setView] = useState<PageView>({ kind: 'list' });

  const handleSelectSelection = (selectionId: number) => {
    setView({ kind: 'edit', selectionId });
  };

  const handleBack = () => {
    setView({ kind: 'list' });
  };

  const handleCreate = () => {
    setView({ kind: 'create' });
  };

  const handleCreated = (newSelectionId: number) => {
    setView({ kind: 'edit', selectionId: newSelectionId });
  };

  if (view.kind === 'edit') {
    return (
      <SelectionManager
        mode="edit"
        selectionId={view.selectionId}
        onBack={handleBack}
      />
    );
  }

  if (view.kind === 'create') {
    return (
      <SelectionManager
        mode="create"
        onBack={handleBack}
        onCreate={handleCreated}
      />
    );
  }

  return (
    <SelectionsList
      isAdmin={true}
      onSelectSelection={handleSelectSelection}
      onCreateSelection={handleCreate}
    />
  );
};
