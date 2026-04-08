import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemes } from '@/api/themes';
import { useAllSelections } from '@/api/collections';
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
      <div className={styles.backdrop} onClick={handleClose} />
      <aside className={styles.panel}>
        <div className={styles['panel-header']}>
          <span className={styles['panel-title']}>Каталог</span>
          <button className={styles['close-btn']} onClick={handleClose}>
            <X style={{ cursor: 'pointer' }} size={18} />
          </button>
        </div>

        <div className={styles['panel-content']}>
          <div className={styles['menu-column']}>
            <MenuView
              onSelectThemes={() => setView('themes')}
              onSelectSelections={() => setView('selections')}
              activeView={view}
            />
          </div>

          <div className={styles['content-column']}>
            {view === 'themes' && (
              <ThemesView onClose={handleClose} navigate={navigate} />
            )}
            {view === 'selections' && (
              <SelectionsView onClose={handleClose} navigate={navigate} />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function MenuView({
  onSelectThemes,
  onSelectSelections,
  activeView,
}: {
  onSelectThemes: () => void;
  onSelectSelections: () => void;
  activeView: PanelView;
}) {
  return (
    <ul className={styles['menu-list']}>
      <li>
        <button
          className={`${styles['menu-item']} ${activeView === 'themes' ? styles['menu-item-active'] : ''}`}
          onClick={onSelectThemes}
        >
          <span>Темы</span>
          <ChevronRight size={16} />
        </button>
      </li>
      <li>
        <button
          className={`${styles['menu-item']} ${activeView === 'selections' ? styles['menu-item-active'] : ''}`}
          onClick={onSelectSelections}
        >
          <span>Подборки</span>
          <ChevronRight size={16} />
        </button>
      </li>
    </ul>
  );
}

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
