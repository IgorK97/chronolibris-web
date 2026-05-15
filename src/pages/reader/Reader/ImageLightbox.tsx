import { createPortal } from 'react-dom';
import styles from './Reader.module.css';

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  onClose,
}) => {
  if (!src) return null;
  return createPortal(
    <div
      className={styles['lightbox-overlay']}
      onClick={onClose}
      title="Закрыть изображение"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <img
        src={src}
        alt=""
        className={styles['lightbox-img']}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
};
