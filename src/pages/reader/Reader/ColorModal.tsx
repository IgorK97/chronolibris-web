import { createPortal } from 'react-dom';
import styles from './Reader.module.css';
import { ColorSwatch } from './ColorSwatch';
import { X } from 'lucide-react';

interface ThemePreset {
  id: string;
  label: string;
  textColor: string;
  pageColor: string;
  bgColor: string;
}

const THEMES: ThemePreset[] = [
  {
    id: 'light',
    label: 'Светлая',
    textColor: '#2c2c2c',
    pageColor: '#faf8f4',
    bgColor: '#e8e4dc',
    // textColor: '#000000',
    // pageColor: '#ffffff',
    // bgColor: '#f5f5f5',
  },
  {
    id: 'sepia',
    label: 'Сепия',
    textColor: '#3b2e1e',
    pageColor: '#f4ede0',
    bgColor: '#d9cdb8',
    // textColor: '#433422',
    // pageColor: '#f4ecd8',
    // bgColor: '#e0d5ba',
  },
  {
    id: 'dark',
    label: 'Тёмная',
    textColor: '#eeeeee',
    pageColor: '#222222',
    bgColor: '#111111',
  },
  {
    id: 'ocean',
    label: 'Океан',
    textColor: '#f0f8ff',
    pageColor: '#1a3a4a',
    bgColor: '#0d1b2a',
  },
];

interface ColorModalProps {
  open: boolean;
  onClose: () => void;
  textColor: string;
  pageColor: string;
  bgColor: string;
  onApplyTheme: (theme: { text: string; page: string; bg: string }) => void;
}

export const ColorModal: React.FC<ColorModalProps> = ({
  open,
  onClose,
  textColor,
  pageColor,
  bgColor,
  onApplyTheme,
}) => {
  if (!open) return null;

  return createPortal(
    <div className={styles['color-overlay']} onClick={onClose}>
      <div
        className={styles['color-modal']}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Настройка оформления"
        style={{
          background: pageColor,
          color: textColor,
          borderColor: bgColor,
        }}
      >
        <div className={styles['color-modal-header']}>
          <span className={styles['color-modal-title']}>Темы оформления</span>
          <button style={{ cursor: 'pointer' }} onClick={onClose}>
            <X />
          </button>
        </div>

        <div className={styles['color-modal-body']}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'end',
              gap: '12px',
            }}
          >
            <span>Текст</span>
            <span>Стр.</span>
            <span>Фон</span>
          </div>

          {THEMES.map((theme) => {
            const isSelected =
              theme.textColor === textColor &&
              theme.pageColor === pageColor &&
              theme.bgColor === bgColor;

            return (
              <div
                key={theme.id}
                className={`${styles['theme-row']} ${isSelected ? styles['active-row'] : ''}`}
                onClick={() =>
                  onApplyTheme({
                    text: theme.textColor,
                    page: theme.pageColor,
                    bg: theme.bgColor,
                  })
                }
              >
                <span className={styles['theme-label']}>{theme.label}</span>

                <div className={styles['theme-swatches-group']}>
                  <ColorSwatch
                    color={theme.textColor}
                    selected={isSelected}
                    onSelect={() => {}}
                    dark
                  />
                  <ColorSwatch
                    color={theme.pageColor}
                    selected={isSelected}
                    onSelect={() => {}}
                  />
                  <ColorSwatch
                    color={theme.bgColor}
                    selected={isSelected}
                    onSelect={() => {}}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
