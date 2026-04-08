import styles from './index.module.css';

export const GenreChip = ({
  onClick,
  genreName,
}: {
  onClick: () => void;
  genreName: string;
}) => {
  return (
    <button className={styles[`genre-chip`]} onClick={onClick}>
      {genreName}
    </button>
  );
};
