import React from 'react';
import { SelectionsList } from './SelectionsList';
import { useNavigate } from 'react-router-dom';

export const SelectionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SelectionsList
      isAdmin={true}
      onSelectSelection={(selectionId) =>
        navigate(`/selections/${selectionId}`)
      }
      onCreateSelection={() => navigate('/selections/new')}
    />
  );
};
