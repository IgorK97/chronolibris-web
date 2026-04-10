import styles from './index.module.css';

export const TagChip = ({
  tagName,
  tagTypeName,
  onClick,
  onDelete,
  disabled,
  readOnly = true,
}: {
  tagName: string;
  tagTypeName?: string;
  onClick?: () => void;
  onDelete?: () => void;
  disabled: boolean;
  readOnly?: boolean;
}) => {
  return (
    <div
      className={`${styles['tag-item']} ${onClick != null || onClick != undefined ? styles['tag-item-clickable'] : ''}`}
      onClick={onClick}
    >
      <span className={styles['tag-name']}>{tagName}</span>
      <span className={styles['tag-type']}>{tagTypeName}</span>
      {!readOnly && (
        <button
          onClick={onDelete}
          className={styles['tag-remove']}
          disabled={disabled}
          title="Удалить тег"
        >
          &times;
        </button>
      )}
    </div>
  );
};
