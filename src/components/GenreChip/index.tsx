import styles from './index.module.css';

export const GenreChip = ({
  onClick,
  genreName,
  onDelete,
  readOnly = true,
}: {
  onClick: () => void;
  genreName: string;
  readOnly?: boolean;
  onDelete?: () => void;
}) => {
  return (
    <div>
      <button className={styles[`genre-chip`]} onClick={onClick}>
        {genreName}
      </button>
      {!readOnly && (
        <button style={{ cursor: 'pointer' }} onClick={onDelete}>
          &times;
        </button>
      )}
    </div>
  );
};
