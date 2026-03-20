import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateReport } from '@/api/reports';
import { TARGET_TYPE } from '@/api/reports';
import styles from './ReportModal.module.css';

export interface ReportModalProps {
  targetId: number;
  targetTypeId: number;
  onClose: () => void;
}

const REASON_TYPES: { id: number; label: string }[] = [
  { id: 1, label: 'Спам' },
  { id: 2, label: 'Ненормативная лексика' },
  { id: 3, label: 'Нарушение авторских прав' },
  { id: 4, label: 'Неприемлемый контент' },
];

function targetTypeLable(typeId: number): string {
  switch (typeId) {
    case TARGET_TYPE.BOOK:
      return 'Книга';
    case TARGET_TYPE.COMMENT:
      return 'Комментарий';
    case TARGET_TYPE.REVIEW:
      return 'Отзыв';
    default:
      return 'Контент';
  }
}

export function ReportModal({
  targetId,
  targetTypeId,
  onClose,
}: ReportModalProps) {
  const [reasonTypeId, setReasonTypeId] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  const [result, setResult] = useState<'success' | 'cooldown' | 'error' | null>(
    null
  );
  const { mutateAsync, isPending } = useCreateReport();
  const handleSubmit = async () => {
    if (!reasonTypeId) return;
    try {
      await mutateAsync({
        targetId,
        targetTypeId,
        reasonTypeId,
        description: description.trim() || undefined,
      });
      setResult('success');
    } catch (err: unknown) {
      const status =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status;
      setResult(status === 409 ? 'cooldown' : 'error');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>
            {targetTypeLable(targetTypeId)} - Пожаловаться
          </span>
          <button className={styles['close-btn']} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          {result === 'success' && (
            <div className={styles['result-success']}>Жалоба принята</div>
          )}
          {result === 'cooldown' && (
            <div className={styles['result-warning']}>
              Вы уже отправляли жалобу недавно. Попробуйте позднее
            </div>
          )}
          {result === 'error' && (
            <div className={styles['result-error']}>
              Не удалось отправить жалобу. Попробйуте позднее
            </div>
          )}
          {result !== 'success' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Причина</label>
                <div className={styles['reason-list']}>
                  {REASON_TYPES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`${styles['reason-btn']} ${
                        reasonTypeId === r.id ? styles['reason-btn-active'] : ''
                      }`}
                      onClick={() => setReasonTypeId(r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Введите описание жалобы</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Опишите нарушение подробнее..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  minLength={50}
                  rows={3}
                />
              </div>
              <div className={styles.footer}>
                <button
                  className={styles['cancel-btn']}
                  onClick={onClose}
                  disabled={isPending}
                >
                  Отмена
                </button>
                <button
                  className={styles['submit-btn']}
                  onClick={handleSubmit}
                  disabled={!reasonTypeId || isPending}
                >
                  {isPending ? 'Отправка...' : 'Отправить жалобу'}
                </button>
              </div>
            </>
          )}
          {result === 'success' && (
            <div className={styles.footer}>
              <button className={styles['submit-btn']} onClick={onClose}>
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
