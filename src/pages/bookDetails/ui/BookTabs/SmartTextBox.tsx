import { useEffect, useRef, useState } from 'react';
import { CornerDownRight, X } from 'lucide-react';
import styles from './BookTabs.module.css';
import { AlertDialog } from '@/components/dialogs/AlertDialog';

export function SmartTextBox({
  placeholder,
  replyingTo,
  onCancelReply,
  onSubmit,
  onDelete,
  initialText = '',
  children,
  type,
  isReadOnly = false,
}: {
  placeholder: string;
  replyingTo?: { parentId: number; authorName: string } | null;
  onCancelReply?: () => void;
  onSubmit: (text: string) => void;
  children?: React.ReactNode;
  type: 'review' | 'comment';
  onDelete?: () => void;
  initialText?: string;
  isReadOnly?: boolean;
}) {
  const [text, setText] = useState(initialText);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 5000;
  const MIN = 120;

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    if (!initialText) setText('');
  };

  const insertControl = (symbol: string, endSymbol = symbol) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    setText(`${before}${symbol}${selected}${endSymbol}${after}`);
  };

  return (
    <div className={styles['compose']}>
      {replyingTo && (
        <div className={styles['compose-reply-banner']}>
          <CornerDownRight size={13} />
          <span>
            Ответ для <strong>{replyingTo.authorName}</strong>
          </span>
          <button
            className={styles['compose-reply-cancel']}
            onClick={onCancelReply}
          >
            <X style={{ cursor: 'pointer' }} />
          </button>
        </div>
      )}
      {
        <AlertDialog
          description="Это действие нельзя будет отменить. После удаления можно написать новый отзыв"
          open={deleteModalOpen}
          title="Вы действительно хотите удалить отзыв?"
          handleAccept={() => {
            if (onDelete) onDelete();
            setDeleteModalOpen(false);
          }}
          handleReject={() => setDeleteModalOpen(false)}
        />
      }
      {children}
      <div>
        <div className={styles['toolbar']}>
          <button
            className={`${styles['toolbar-btn']} ${styles['bold']}`}
            onClick={() => insertControl('**')}
            title="Жирный"
          >
            B
          </button>

          <button
            className={`${styles['toolbar-btn']} ${styles['italic']}`}
            onClick={() => insertControl('__')}
            title="Курсив"
          >
            i
          </button>

          <button
            className={`${styles['toolbar-btn']} ${styles['strike']}`}
            onClick={() => insertControl('~~')}
            title="Зачеркнутый"
          >
            S
          </button>

          <button
            className={`${styles['toolbar-btn']} ${styles['spoiler-btn']}`}
            onClick={() => insertControl('>!', '!<')}
            title="Скрыть"
          >
            Скрыть
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className={styles['compose-textarea']}
          placeholder={placeholder}
          value={text}
          maxLength={MAX}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          minLength={type === 'review' ? MIN : 1}
          disabled={isReadOnly}
        />
        <div className={styles['compose-footer']}>
          <span className={styles['compose-counter']}>
            {text.length}/{MAX}
          </span>
          <span
            className={styles['compose-counter']}
            style={{ color: 'red' }}
          >{`${type === 'review' && text.length < MIN ? `Минимальное количество символов - ${MIN}` : ''}`}</span>
          {initialText ? (
            <button
              className={`${styles['compose-submit']} ${styles['compose-delete']}`}
              onClick={() => setDeleteModalOpen(true)}
              style={{ backgroundColor: '#dc2626' }}
            >
              Удалить отзыв
            </button>
          ) : (
            <button
              className={styles['compose-submit']}
              disabled={
                !text.trim() || text.length < (type === 'review' ? MIN : 1)
              }
              title={`${type === 'review' && text.length < MIN ? `Минимальное количество символов - ${MIN}` : ''}`}
              onClick={handleSubmit}
            >
              Отправить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
