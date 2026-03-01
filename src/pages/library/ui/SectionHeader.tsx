// import React from "react";
// import { useTranslation } from "react-i18next";
import styles from './SectionHeader.module.css';
import { t } from 'i18next';

interface SectionHeaderProps {
  title: string;
  onPress?: () => void;
}

export function SectionHeader({ title, onPress }: SectionHeaderProps) {
  //   const { t } = useTranslation();

  return (
    <div className={styles['container']}>
      <h2 className={styles['title']}>{title}</h2>

      <button type="button" className={styles['button']} onClick={onPress}>
        {t('sect_header.all')}
      </button>
    </div>
  );
}
