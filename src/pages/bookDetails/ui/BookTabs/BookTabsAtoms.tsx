import { useEffect, useRef, useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  CornerDownRight,
  X,
} from 'lucide-react';
import styles from './BookTabs.module.css';
import { getInitials, getAvatarColor } from './BookTabsData';
import { ReportModal } from '@/components/reports/ReportModal';
import { useStore } from '@stores/globalStore';
export function Avatar({ userName }: { userName: string }) {
  return (
    <div
      className={styles['avatar']}
      style={{
        backgroundColor: getAvatarColor(userName),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {getInitials(userName)}
    </div>
  );
}

export function VoteButton({
  type,
  count,
  disabled,
  active,
  onClick,
}: {
  type: 'like' | 'dislike';
  count: number;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = type === 'like' ? ThumbsUp : ThumbsDown;

  return (
    <div className={styles['vote-wrapper']}>
      <button
        className={`${styles['vote-btn']} ${active ? styles['vote-btn-active'] : ''} ${styles[`vote-btn-${type}`]}`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={type === 'like' ? 'Нравится' : 'Не нравится'}
        disabled={disabled}
      >
        <Icon size={14} />
      </button>
      {showTooltip && <div className={styles['vote-tooltip']}>{count}</div>}
    </div>
  );
}

export function ScoreDisplay({
  likes,
  dislikes,
}: {
  likes: number;
  dislikes: number;
}) {
  const score = likes - dislikes;
  const color = score > 0 ? '#16a34a' : score < 0 ? '#dc2626' : '#6b7280';
  return (
    <span className={styles['score']} style={{ color }}>
      {score > 0 ? '+' : ''}
      {score}
    </span>
  );
}

export function ThreeDotsMenu({
  canDelete,
  onDelete,
  canReport = true,
  targetId,
  targetTypeId,
}: {
  type?: 'comment' | 'review';
  canDelete: boolean;
  canReport?: boolean;
  onDelete: () => Promise<void>;
  targetId: number;
  targetTypeId: number;
}) {
  const { user, isReader } = useStore();
  const isAuth = !!user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);
  const showReport = isAuth && !canDelete && isReader() && canReport;
  if (!canDelete && !showReport) return null;
  return (
    <>
      <div
        className={styles['comment-menu-wrapper']}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className={styles['comment-menu-btn']}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Действия"
        >
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div className={styles['comment-menu']}>
            {showReport && (
              <button
                className={styles['comment-menu-item']}
                onClick={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
              >
                Пожаловаться
              </button>
            )}

            {canDelete && (
              <button
                className={styles['comment-menu-item']}
                onClick={async () => {
                  await onDelete();
                  setMenuOpen(false);
                }}
              >
                Удалить
              </button>
            )}
          </div>
        )}
      </div>
      {reportOpen && (
        <ReportModal
          targetId={targetId}
          targetTypeId={targetTypeId}
          onClose={() => setReportOpen(false)}
        />
      )}
    </>
  );
}

export function ComposeBox({
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
      {children}
      <textarea
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
        {initialText ? (
          <button
            className={`${styles['compose-submit']} ${styles['compose-delete']}`}
            onClick={onDelete}
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
            onClick={handleSubmit}
          >
            Отправить
          </button>
        )}
      </div>
    </div>
  );
}

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
            onClick={() => insertControl('_')}
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
          {initialText ? (
            <button
              className={`${styles['compose-submit']} ${styles['compose-delete']}`}
              onClick={onDelete}
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
