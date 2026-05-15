import styles from './index.module.css';

export const ExpandChildButton = ({
  hasChildren,
  handleExpandClick,
  isExpanded,
}: {
  hasChildren: boolean;
  handleExpandClick: (e: React.MouseEvent) => void;
  isExpanded: boolean;
}) => {
  return hasChildren ? (
    <button
      className={styles['expand-button']}
      onClick={handleExpandClick}
      title={isExpanded ? 'Свернуть' : 'Развернуть'}
    >
      {isExpanded ? '▾' : '▸'}
    </button>
  ) : (
    <span className={styles['expand-placeholder']} />
  );
};
