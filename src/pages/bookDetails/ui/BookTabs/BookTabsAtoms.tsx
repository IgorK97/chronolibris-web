import { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  CornerDownRight,
} from 'lucide-react';
// import type { ItemAuthor } from './bookTabsData';
import styles from './BookTabs.module.css';

// ─── Avatar ───────────────────────────────────────────────────────────────────

import { getInitials, getAvatarColor } from './BookTabsData';

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

// ─── VoteButton ───────────────────────────────────────────────────────────────

export function VoteButton({
  type,
  count,
  active,
  onClick,
}: {
  type: 'like' | 'dislike';
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = type === 'like' ? ThumbsUp : ThumbsDown;

  return (
    <div className={styles['vote-wrapper']}>
      <button
        className={`${styles['vote-btn']} ${active ? styles['vote-btn--active'] : ''} ${styles[`vote-btn--${type}`]}`}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={type === 'like' ? 'Нравится' : 'Не нравится'}
      >
        <Icon size={14} />
      </button>
      {showTooltip && <div className={styles['vote-tooltip']}>{count}</div>}
    </div>
  );
}

// ─── Score display ────────────────────────────────────────────────────────────

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

// ─── Three-dots menu ──────────────────────────────────────────────────────────

export function ThreeDotsMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reported, setReported] = useState(false);

  return (
    <div className={styles['comment-menu-wrapper']}>
      <button
        className={styles['comment-menu-btn']}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Действия"
      >
        <MoreHorizontal size={15} />
      </button>
      {menuOpen && (
        <div className={styles['comment-menu']}>
          {reported ? (
            <span
              className={styles['comment-menu-item']}
              style={{ color: '#6b7280', cursor: 'default' }}
            >
              Жалоба отправлена
            </span>
          ) : (
            <button
              className={styles['comment-menu-item']}
              onClick={() => {
                setReported(true);
                setMenuOpen(false);
              }}
            >
              Пожаловаться
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ComposeBox ───────────────────────────────────────────────────────────────

export function ComposeBox({
  placeholder,
  replyingTo,
  onCancelReply,
  onSubmit,
  children,
}: {
  placeholder: string;
  replyingTo?: { parentId: number; authorName: string } | null;
  onCancelReply?: () => void;
  onSubmit: (text: string) => void;
  children?: React.ReactNode; // slot for extra fields (e.g. star picker)
}) {
  const [text, setText] = useState('');
  const MAX = 2000;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
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
            ✕
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
      />
      <div className={styles['compose-footer']}>
        <span className={styles['compose-counter']}>
          {text.length}/{MAX}
        </span>
        <button
          className={styles['compose-submit']}
          disabled={!text.trim()}
          onClick={handleSubmit}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
