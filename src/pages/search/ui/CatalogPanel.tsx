import { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  //   ChevronDown,
  //   ChevronUp,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemes } from '@/api/themes';
import {
  useAllSelections,
  // useSelectionsInfinite
} from '@/api/collections';
import styles from './CatalogPanel.module.css';

interface CatalogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type PanelView = 'menu' | 'themes' | 'selections';

export function CatalogPanel({ isOpen, onClose }: CatalogPanelProps) {
  const [view, setView] = useState<PanelView>('menu');
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    setView('menu');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={handleClose} />

      {/* Panel */}
      <aside className={styles.panel}>
        <div className={styles['panel-header']}>
          {view !== 'menu' && (
            <button
              className={styles['back-btn']}
              onClick={() => setView('menu')}
            >
              <ChevronLeft size={16} />
              Назад
            </button>
          )}
          <span className={styles['panel-title']}>
            {view === 'menu' && 'Каталог'}
            {view === 'themes' && 'Темы'}
            {view === 'selections' && 'Подборки'}
          </span>
          <button className={styles['close-btn']} onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles['panel-content']}>
          {view === 'menu' && (
            <MenuView
              onSelectThemes={() => setView('themes')}
              onSelectSelections={() => setView('selections')}
            />
          )}
          {view === 'themes' && (
            <ThemesView onClose={handleClose} navigate={navigate} />
          )}
          {view === 'selections' && (
            <SelectionsView onClose={handleClose} navigate={navigate} />
          )}
        </div>
      </aside>
    </>
  );
}

// --- Menu View ---
function MenuView({
  onSelectThemes,
  onSelectSelections,
}: {
  onSelectThemes: () => void;
  onSelectSelections: () => void;
}) {
  return (
    <ul className={styles['menu-list']}>
      <li>
        <button className={styles['menu-item']} onClick={onSelectThemes}>
          <span>Темы</span>
          <ChevronRight size={16} />
        </button>
      </li>
      <li>
        <button className={styles['menu-item']} onClick={onSelectSelections}>
          <span>Подборки</span>
          <ChevronRight size={16} />
        </button>
      </li>
    </ul>
  );
}

// --- Themes View ---
function ThemesView({
  onClose,
  navigate,
}: {
  onClose: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data: themes, isLoading } = useThemes();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleGoToTheme = (themeId: number) => {
    navigate(`/search?themeId=${themeId}`);
    onClose();
  };

  const handleGoToAll = () => {
    navigate('/search');
    onClose();
  };

  return (
    <div className={styles['sub-view']}>
      <button className={styles['go-all-btn']} onClick={handleGoToAll}>
        Перейти ко всем
      </button>

      {isLoading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <ul className={styles['item-list']}>
          {(themes ?? []).map((theme) => (
            <li key={theme.id}>
              <button
                className={`${styles['item-btn']} ${selectedId === theme.id ? styles['item-btn-selected'] : ''}`}
                onClick={() => {
                  setSelectedId(theme.id);
                  handleGoToTheme(theme.id);
                }}
              >
                {theme.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Selections View ---
function SelectionsView({
  onClose,
  navigate,
}: {
  onClose: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data: selections, isLoading } = useAllSelections();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleGoToSelection = (selectionId: number) => {
    navigate(`/search?selectionId=${selectionId}`);
    onClose();
  };

  const handleGoToAll = () => {
    navigate('/search');
    onClose();
  };

  return (
    <div className={styles['sub-view']}>
      <button className={styles['go-all-btn']} onClick={handleGoToAll}>
        Перейти ко всем
      </button>

      {isLoading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <ul className={styles['item-list']}>
          {(selections ?? []).map((sel) => (
            <li key={sel.id}>
              <button
                className={`${styles['item-btn']} ${selectedId === sel.id ? styles['item-btn-selected'] : ''}`}
                onClick={() => {
                  setSelectedId(sel.id);
                  handleGoToSelection(sel.id);
                }}
              >
                {sel.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
