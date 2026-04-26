import { createPortal } from 'react-dom';
import styles from './Reader.module.scss';
import { BG_COLORS, PAGE_COLORS, TEXT_COLORS } from '@/utils/readerOpts';
import { ColorSwatch } from './ColorSwatch';

interface ColorModalProps {
  open: boolean;
  onClose: () => void;
  textColor: string;
  pageColor: string;
  bgColor: string;
  onTextColor: (c: string) => void;
  onPageColor: (c: string) => void;
  onBgColor: (c: string) => void;
}

export const ColorModal: React.FC<ColorModalProps> = ({
  open,
  onClose,
  textColor,
  pageColor,
  bgColor,
  onTextColor,
  onPageColor,
  onBgColor,
}) => {
  if (!open) return null;
  const rows = [
    {
      label: 'Цвет текста',
      colors: TEXT_COLORS,
      value: textColor,
      onChange: onTextColor,
    },
    {
      label: 'Цвет страницы',
      colors: PAGE_COLORS,
      value: pageColor,
      onChange: onPageColor,
    },
    {
      label: 'Цвет фона',
      colors: BG_COLORS,
      value: bgColor,
      onChange: onBgColor,
    },
  ];
  return createPortal(
    <div className={styles['color-overlay']} onClick={onClose}>
      <div
        className={styles['color-modal']}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Настройка цветов"
      >
        <div className={styles['color-modal-header']}>
          <span className={styles['color-modal-title']}>Цвета оформления</span>
          <button
            className={styles['footnote-close']}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className={styles['color-modal-body']}>
          {rows.map((row) => (
            <div key={row.label} className={styles['color-row']}>
              <span className={styles['color-row-label']}>{row.label}</span>
              <div className={styles['color-swatches']}>
                {row.colors.map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    selected={row.value === c}
                    onSelect={() => row.onChange(c)}
                    dark={row.label === 'Цвет текста'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
