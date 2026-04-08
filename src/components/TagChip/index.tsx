import styles from './index.module.css';

export const TagChip = ({
  tagName,
  tagTypeName,
  onClick,
  disabled,
  readOnly = true,
}: {
  tagName: string;
  tagTypeName?: string;
  onClick: () => void;
  disabled: boolean;
  readOnly?: boolean;
}) => {
  return (
    <div className={styles['tag-item']}>
      <span className={styles['tag-name']}>{tagName}</span>
      <span className={styles['tag-type']}>{tagTypeName}</span>
      {!readOnly && (
        <button
          onClick={onClick}
          className={styles['tag-remove']}
          disabled={disabled}
          title="Удалить тег"
        >
          ×
        </button>
      )}
    </div>
  );
};
