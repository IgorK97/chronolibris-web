import styles from './BookShelfConstructing.module.css';
import { WandSparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export const BookShelfConstructing = ({
  handleCreate,
  initialValue = '',
}: {
  handleCreate: (name: string) => Promise<void>;
  initialValue?: string;
}) => {
  const [newName, setNewName] = useState(initialValue);

  useEffect(() => {
    setNewName(initialValue);
  }, [initialValue]);

  return (
    <div className={styles['create-row']}>
      <input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        autoFocus
        style={{ width: '350px' }}
      />
      <button onClick={() => handleCreate(newName)}>
        <WandSparkles style={{ cursor: 'pointer' }} size={18} />
      </button>
    </div>
  );
};
