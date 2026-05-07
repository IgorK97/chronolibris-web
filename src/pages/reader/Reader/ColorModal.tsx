// import { createPortal } from 'react-dom';
// import styles from './Reader.module.css';
// import { BG_COLORS, PAGE_COLORS, TEXT_COLORS } from '@/utils/readerOpts';
// import { ColorSwatch } from './ColorSwatch';

// interface ColorModalProps {
//   open: boolean;
//   onClose: () => void;
//   textColor: string;
//   pageColor: string;
//   bgColor: string;
//   onTextColor: (c: string) => void;
//   onPageColor: (c: string) => void;
//   onBgColor: (c: string) => void;
// }

// export const ColorModal: React.FC<ColorModalProps> = ({
//   open,
//   onClose,
//   textColor,
//   pageColor,
//   bgColor,
//   onTextColor,
//   onPageColor,
//   onBgColor,
// }) => {
//   if (!open) return null;
//   const rows = [
//     {
//       label: 'Цвет текста',
//       colors: TEXT_COLORS,
//       value: textColor,
//       onChange: onTextColor,
//     },
//     {
//       label: 'Цвет страницы',
//       colors: PAGE_COLORS,
//       value: pageColor,
//       onChange: onPageColor,
//     },
//     {
//       label: 'Цвет фона',
//       colors: BG_COLORS,
//       value: bgColor,
//       onChange: onBgColor,
//     },
//   ];
//   return createPortal(
//     <div className={styles['color-overlay']} onClick={onClose}>
//       <div
//         className={styles['color-modal']}
//         onClick={(e) => e.stopPropagation()}
//         role="dialog"
//         aria-modal="true"
//         aria-label="Настройка цветов"
//       >
//         <div className={styles['color-modal-header']}>
//           <span className={styles['color-modal-title']}>Цвета оформления</span>
//           <button
//             className={styles['footnote-close']}
//             onClick={onClose}
//             aria-label="Закрыть"
//           >
//             ✕
//           </button>
//         </div>
//         <div className={styles['color-modal-body']}>
//           {rows.map((row) => (
//             <div key={row.label} className={styles['color-row']}>
//               <span className={styles['color-row-label']}>{row.label}</span>
//               <div className={styles['color-swatches']}>
//                 {row.colors.map((c) => (
//                   <ColorSwatch
//                     key={c}
//                     color={c}
//                     selected={row.value === c}
//                     onSelect={() => row.onChange(c)}
//                     dark={row.label === 'Цвет текста'}
//                   />
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// };

import { createPortal } from 'react-dom';
import styles from './Reader.module.css';
import { ColorSwatch } from './ColorSwatch';
import { X } from 'lucide-react';

// Определяем структуру темы
interface ThemePreset {
  id: string;
  label: string;
  textColor: string;
  pageColor: string;
  bgColor: string;
}

// Выносим пресеты (можно в отдельный файл readerOpts.ts)
const THEMES: ThemePreset[] = [
  {
    id: 'light',
    label: 'Светлая',
    textColor: '#000000',
    pageColor: '#ffffff',
    bgColor: '#f5f5f5',
  },
  {
    id: 'sepia',
    label: 'Сепия',
    textColor: '#433422',
    pageColor: '#f4ecd8',
    bgColor: '#e0d5ba',
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
  // Текущие значения (состояние хранится в родителе)
  textColor: string;
  pageColor: string;
  bgColor: string;
  // Функция для смены всего набора сразу
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
      >
        <div className={styles['color-modal-header']}>
          <span className={styles['color-modal-title']}>Темы оформления</span>
          <button style={{ cursor: 'pointer' }} onClick={onClose}>
            <X />
          </button>
        </div>

        <div className={styles['color-modal-body']}>
          {/* Шапка таблицы для наглядности */}
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
            // Проверяем, выбрана ли эта тема сейчас (сравнение по всем цветам)
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
