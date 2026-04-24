/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  useInfiniteReports,
  useTargetInfo,
  useInfiniteTargetReports,
  useCreateModerationTask,
  useResolveTask,
} from '../../api/reports';
import { ArrowBigRight, X } from 'lucide-react';
import styles from './ModerationPage.module.css';
import {
  TARGET_TYPE,
  TARGET_TYPE_LABEL,
  TASK_STATUS,
  TASK_STATUS_LABEL,
  type ReportShortDto,
} from '@/types';

type StatusFilter = 'free' | 'inProgress' | 'accepted' | 'rejected';

interface Filters {
  statusFilter: StatusFilter;
  targetTypeId: number | null;
  reasonTypeId: number | null;
}

const DEFAULT_FILTERS: Filters = {
  statusFilter: 'free',
  targetTypeId: null,
  reasonTypeId: null,
};

const REASON_TYPES: { id: number; label: string }[] = [
  { id: 1, label: 'Спам' },
  { id: 2, label: 'Ненормативная лексика' },
  { id: 3, label: 'Нарушение авторских прав' },
  { id: 4, label: 'Терроризм и экстремизм' },
  { id: 5, label: 'Иное' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildFiltersRequest(filters: Filters) {
  const statusFilter = filters.statusFilter !== null;
  let reportStatusId: number | null = null;

  if (filters.statusFilter === 'free') {
    reportStatusId = null;
  } else if (filters.statusFilter === 'inProgress') {
    reportStatusId = TASK_STATUS.IN_PROGRESS;
  } else if (filters.statusFilter === 'accepted') {
    reportStatusId = TASK_STATUS.ACCEPTED;
  } else if (filters.statusFilter === 'rejected') {
    reportStatusId = TASK_STATUS.REJECTED;
  }

  return {
    targetTypeFilter: filters.targetTypeId !== null,
    reportTypeFilter: filters.reasonTypeId !== null,
    reportStatusFilter: statusFilter,
    reportStatusId: reportStatusId ?? undefined,
    lastTargetTypeId: filters.targetTypeId ?? undefined,
    lastReportTypeId: filters.reasonTypeId ?? undefined,
  };
}

interface ReportsModalProps {
  targetId: number;
  targetTypeId: number;
  reasonTypeId: number;
  onClose: () => void;
}

function ReportsModal({
  targetId,
  targetTypeId,
  reasonTypeId,
  onClose,
}: ReportsModalProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteTargetReports({ targetId, targetTypeId, reasonTypeId }, true);

  const allReports = data?.pages.flatMap((p) => p.reports) ?? [];

  return (
    <div className={styles['modal-overlay']} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles['modal-header']}>
          <span className={styles['modal-title']}>
            Жалобы на {TARGET_TYPE_LABEL[targetTypeId]} #{targetId}
          </span>
          <button className={styles['close-btn']} onClick={onClose}>
            <X />
          </button>
        </div>

        <div className={styles['modal-body']}>
          {isLoading && <div className={styles.hint}>Загрузка...</div>}

          {allReports.map((report) => (
            <div key={report.id} className={styles['report-item']}>
              <div className={styles['report-meta']}>
                <span className={styles.chip}>#{report.id}</span>
                <span className={styles.muted}>
                  Пользователь {report.reporterId}
                </span>
                <span className={styles.muted}>
                  {formatDate(report.createdAt)}
                </span>
              </div>
              <p className={styles['report-text']}>
                {report.text || <em className={styles.muted}>Без текста</em>}
              </p>
            </div>
          ))}

          {allReports.length === 0 && !isLoading && (
            <div className={styles.hint}>Жалобы не найдены</div>
          )}

          {hasNextPage && (
            <button
              className={styles['load-more-btn']}
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface TargetInfoPanelProps {
  targetId: number;
  targetTypeId: number;
}

function TargetInfoPanel({ targetId, targetTypeId }: TargetInfoPanelProps) {
  const { data, isLoading, isError } = useTargetInfo(
    targetTypeId,
    targetId,
    true
  );

  if (isLoading)
    return <div className={styles.hint}>Загрузка информации...</div>;
  if (isError || !data)
    return (
      <div className={styles['error-hint']}>Не удалось загрузить данные</div>
    );

  const isBook = targetTypeId === TARGET_TYPE.BOOK;

  return (
    <div className={styles['target-panel']}>
      {isBook ? (
        <>
          <div className={styles['target-field']}>
            <span className={styles['field-label']}>Книга:</span>
            <span>{data.bookTitle ?? '—'}</span>
          </div>
          {data.bookDescription && (
            <div className={styles['target-field']}>
              <span className={styles['field-label']}>Описание:</span>
              <span className={styles['target-description']}>
                {data.bookDescription}
              </span>
            </div>
          )}
          <a
            href={`/book/${data.targetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookLink}
          >
            Перейти к книге <ArrowBigRight />
          </a>
        </>
      ) : (
        <>
          <div className={styles['target-field']}>
            <span className={styles['field-label']}>Автор:</span>
            <span>Пользователь {data.readerId ?? '—'}</span>
          </div>
          {data.text && (
            <div className={styles['target-field']}>
              <span className={styles['field-label']}>Текст:</span>
              <span className={styles['target-description']}>{data.text}</span>
            </div>
          )}
          {targetTypeId === TARGET_TYPE.COMMENT && data.parentCommentText && (
            <div className={styles['target-field']}>
              <span className={styles['field-label']}>
                Родительский комментарий:
              </span>
              <span className={styles['target-description']}>
                {data.parentCommentText}
              </span>
            </div>
          )}
          <a
            href={`/book/${data.bookId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookLink}
          >
            Перейти к книге <ArrowBigRight />
          </a>
        </>
      )}
    </div>
  );
}

interface ReportRowProps {
  report: ReportShortDto;
  onUpdated: () => void;
}

function ReportRow({ report, onUpdated }: ReportRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reportText, setReportText] = useState<string>(report.comment);
  const createTask = useCreateModerationTask();
  const resolveTask = useResolveTask();
  const [error, setError] = useState(
    report.comment.length < 20 ? 'Напишие комментарий к решению' : ''
  );

  const reasonLabel =
    REASON_TYPES.find((r) => r.id === report.reasonTypeId)?.label ??
    `Тип ${report.reasonTypeId}`;

  const isInProgress =
    report.taskStatusId === TASK_STATUS.IN_PROGRESS &&
    report.moderationTaskId !== null;

  const isResolved =
    report.taskStatusId === TASK_STATUS.ACCEPTED ||
    report.taskStatusId === TASK_STATUS.REJECTED;

  const isFree = !report.moderationTaskId;
  const isActionLoading = createTask.isPending || resolveTask.isPending;

  useEffect(() => {
    setError(reportText.length < 20 ? 'Напишие комментарий к решению' : '');
  }, [reportText]);

  const handleTakeTask = async () => {
    await createTask.mutateAsync({
      targetId: report.targetId,
      targetTypeId: report.targetTypeId,
      reportTypeId: report.reasonTypeId,
    });
    onUpdated();
  };

  const handleResolve = async (resolution: boolean) => {
    try {
      if (!report.moderationTaskId) return;
      if (reportText.length < 20) return;
      await resolveTask.mutateAsync({
        taskId: report.moderationTaskId,
        resolution,
        reportText,
      });
      onUpdated();
    } catch (e: any) {
      setError(`Ошибка: ${e.response.data?.detail}`);
    }
  };

  return (
    <>
      <div className={styles.row}>
        <div className={styles['row-header']}>
          <div className={styles['row-title']}>
            <span className={styles['target-label']}>
              Жалоба на {TARGET_TYPE_LABEL[report.targetTypeId]} #
              {report.targetId}
            </span>
            <span className={styles['reason-chip']}>{reasonLabel}</span>
            {report.taskStatusId !== null && (
              <span
                className={`${styles['status-chip']} ${
                  isInProgress ? styles['status-in-progress'] : {}
                } ${
                  report.taskStatusId === TASK_STATUS.ACCEPTED
                    ? styles['status-accepted']
                    : {}
                }${
                  report.taskStatusId === TASK_STATUS.REJECTED
                    ? styles['status-rejected']
                    : {}
                }`}
              >
                {TASK_STATUS_LABEL[report.taskStatusId]}
              </span>
            )}
          </div>

          <div className={styles['row-meta']}>
            <span className={styles.muted}>
              {report.count} жал. · первая {formatDate(report.firstReportDate)}{' '}
              · последняя {formatDate(report.lastReportDate)}
            </span>
          </div>
        </div>

        <div className={styles['row-actions']}>
          <button
            className={styles['action-btn']}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Скрыть инфо' : 'Показать инфо'}
          </button>

          <button
            className={styles['action-btn']}
            onClick={() => setModalOpen(true)}
          >
            Жалобы
          </button>

          {isFree && (
            <button
              className={`${styles['action-btn']} ${styles['primary-btn']}`}
              onClick={handleTakeTask}
              disabled={isActionLoading}
            >
              {createTask.isPending ? '...' : 'Взять в обработку'}
            </button>
          )}

          {isInProgress && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <textarea
                  placeholder="Комментарий"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  minLength={50}
                />
                {error && (
                  <p style={{ marginTop: '5px', color: 'red' }}>{error}</p>
                )}
              </div>
              <button
                className={`${styles['action-btn']} ${styles['accept-btn']}`}
                onClick={() => handleResolve(true)}
                disabled={isActionLoading}
              >
                {resolveTask.isPending ? '...' : 'Принять'}
              </button>
              <button
                className={`${styles['action-btn']} ${styles['reject-btn']}`}
                onClick={() => handleResolve(false)}
                disabled={isActionLoading}
              >
                {resolveTask.isPending ? '...' : 'Отклонить'}
              </button>
            </>
          )}

          {isResolved && (
            <>
              <span className={styles['resolved-info']}>
                Решено: {formatDate(report.taskResolvedAt)}
              </span>
              <textarea
                style={{ minWidth: '50%' }}
                placeholder="Комментарий"
                value={reportText}
                readOnly
              />
            </>
          )}
        </div>

        {expanded && (
          <TargetInfoPanel
            targetId={report.targetId}
            targetTypeId={report.targetTypeId}
          />
        )}
      </div>

      {modalOpen && (
        <ReportsModal
          targetId={report.targetId}
          targetTypeId={report.targetTypeId}
          reasonTypeId={report.reasonTypeId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export function ModerationPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(DEFAULT_FILTERS);

  const filtersRequest = buildFiltersRequest(appliedFilters);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteReports(filtersRequest);

  const allReports = data?.pages.flatMap((p) => p.reports) ?? [];

  const observerRef = useRef<IntersectionObserver | null>(null);

  const setSentinel = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const applyFilters = () => setAppliedFilters({ ...filters });

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles['page-title']}>Панель модерации</h1>

      <div className={styles['filters-bar']}>
        <div className={styles['filter-group']}>
          <label className={styles['filter-label']}>Статус</label>
          <select
            className={styles.select}
            value={filters.statusFilter}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                statusFilter: e.target.value as StatusFilter,
              }))
            }
          >
            <option value="free">Новые (свободные)</option>
            <option value="inProgress">В обработке</option>
            <option value="accepted">Принятые</option>
            <option value="rejected">Отклоненные</option>
          </select>
        </div>

        <div className={styles['filter-group']}>
          <label className={styles['filter-label']}>Тип контента</label>
          <select
            className={styles.select}
            value={filters.targetTypeId ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                targetTypeId: e.target.value ? Number(e.target.value) : null,
              }))
            }
          >
            <option value="">Все</option>
            <option value={TARGET_TYPE.BOOK}>Книга</option>
            <option value={TARGET_TYPE.COMMENT}>Комментарий</option>
            <option value={TARGET_TYPE.REVIEW}>Отзыв</option>
          </select>
        </div>

        <div className={styles['filter-group']}>
          <label className={styles['filter-label']}>Тип жалобы</label>
          <select
            className={styles.select}
            value={filters.reasonTypeId ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                reasonTypeId: e.target.value ? Number(e.target.value) : null,
              }))
            }
          >
            <option value="">Все</option>
            {REASON_TYPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className={`${styles['action-btn']} ${styles['primary-btn']}`}
          onClick={applyFilters}
        >
          Применить
        </button>
        <button className={styles['action-btn']} onClick={resetFilters}>
          Сбросить
        </button>
      </div>

      <div className={styles.list}>
        {isLoading && <div className={styles.hint}>Загрузка...</div>}
        {isError && (
          <div className={styles['error-hint']}>Ошибка загрузки </div>
        )}

        {!isLoading && allReports.length === 0 && (
          <div className={styles.hint}>Жалоб не найдено</div>
        )}

        {allReports.map((report) => (
          <ReportRow
            key={`${report.targetId}-${report.targetTypeId}-${report.reasonTypeId}`}
            report={report}
            onUpdated={refetch}
          />
        ))}

        <div ref={setSentinel} style={{ height: 1 }} />

        {isFetchingNextPage && (
          <div className={styles.hint}>Загрузка следующей страницы...</div>
        )}
      </div>
    </div>
  );
}
