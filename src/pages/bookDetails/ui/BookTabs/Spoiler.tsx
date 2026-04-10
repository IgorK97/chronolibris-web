import { useState } from 'react';
import styles from './BookTabs.module.css';

export const Spoiler = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
      className={`${styles.spoiler} ${isVisible ? styles['spoiler-visible'] : ''}`}
    >
      {isVisible ? (
        children
      ) : (
        <span className={styles['spoiler-label']}>####</span>
      )}
    </span>
  );
};
