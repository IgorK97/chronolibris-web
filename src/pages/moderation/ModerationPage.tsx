import { useState, useCallback, useRef } from 'react';
import {
  TARGET_TYPE,
  TARGET_TYPE_LABEL,
  TASK_STATUS,
  TASK_STATUS_LABEL,
  useInfiniteReports,
  useTargetInfo,
  useInfiniteTargetReports,
  useCreateModerationTask,
  useResolveTask,
  type ReportShortDto,
} from '../../api/reports';

// ─── Filter state ─────────────────────────────────────────────────────────────

type StatusFilter = 'free' | 'inProgress' | 'resolved';

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

// Перечень типов жалоб — должен соответствовать справочнику ReportReasonType в БД
const REASON_TYPES: { id: number; label: string }[] = [
  { id: 1, label: 'Спам' },
  { id: 2, label: 'Оскорбление' },
  { id: 3, label: 'Нарушение авторских прав' },
  { id: 4, label: 'Неприемлемый контент' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    reportStatusId = null; // сервер фильтрует ModerationTaskId == null
  } else if (filters.statusFilter === 'inProgress') {
    reportStatusId = TASK_STATUS.IN_PROGRESS;
  } else if (filters.statusFilter === 'resolved') {
    // Сервер вернёт записи с любым закрытым таском — логика на стороне фильтра
    reportStatusId = TASK_STATUS.ACCEPTED;
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

// ─── ReportsModal ─────────────────────────────────────────────────────────────

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
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>
            Жалобы на {TARGET_TYPE_LABEL[targetTypeId]} #{targetId}
          </span>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.modalBody}>
          {isLoading && <div style={styles.hint}>Загрузка...</div>}

          {allReports.map((report) => (
            <div key={report.id} style={styles.reportItem}>
              <div style={styles.reportMeta}>
                <span style={styles.chip}>#{report.id}</span>
                <span style={styles.muted}>
                  Пользователь {report.reporterId}
                </span>
                <span style={styles.muted}>{formatDate(report.createdAt)}</span>
              </div>
              <p style={styles.reportText}>
                {report.text || <em style={styles.muted}>Без текста</em>}
              </p>
            </div>
          ))}

          {allReports.length === 0 && !isLoading && (
            <div style={styles.hint}>Жалобы не найдены</div>
          )}

          {hasNextPage && (
            <button
              style={styles.loadMoreBtn}
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

// ─── TargetInfoPanel ──────────────────────────────────────────────────────────

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

  if (isLoading) return <div style={styles.hint}>Загрузка информации...</div>;
  if (isError || !data)
    return <div style={styles.errorHint}>Не удалось загрузить данные</div>;

  const isBook = targetTypeId === TARGET_TYPE.BOOK;

  return (
    <div style={styles.targetPanel}>
      {isBook ? (
        <>
          <div style={styles.targetField}>
            <span style={styles.fieldLabel}>Книга:</span>
            <span>{data.bookTitle ?? '—'}</span>
          </div>
          {data.bookDescription && (
            <div style={styles.targetField}>
              <span style={styles.fieldLabel}>Описание:</span>
              <span style={styles.targetDescription}>
                {data.bookDescription}
              </span>
            </div>
          )}
          <a
            href={`/book/${data.targetId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.bookLink}
          >
            Перейти к книге →
          </a>
        </>
      ) : (
        <>
          <div style={styles.targetField}>
            <span style={styles.fieldLabel}>Автор:</span>
            <span>Пользователь {data.readerId ?? '—'}</span>
          </div>
          {data.text && (
            <div style={styles.targetField}>
              <span style={styles.fieldLabel}>Текст:</span>
              <span style={styles.targetDescription}>{data.text}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── ReportRow ────────────────────────────────────────────────────────────────

interface ReportRowProps {
  report: ReportShortDto;
  onUpdated: () => void;
}

function ReportRow({ report, onUpdated }: ReportRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const createTask = useCreateModerationTask();
  const resolveTask = useResolveTask();

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

  const handleTakeTask = async () => {
    await createTask.mutateAsync({
      targetId: report.targetId,
      targetTypeId: report.targetTypeId,
      reportTypeId: report.reasonTypeId,
    });
    onUpdated();
  };

  const handleResolve = async (resolution: boolean) => {
    if (!report.moderationTaskId) return;
    await resolveTask.mutateAsync({
      taskId: report.moderationTaskId,
      resolution,
    });
    onUpdated();
  };

  const isActionLoading = createTask.isPending || resolveTask.isPending;

  return (
    <>
      <div style={styles.row}>
        {/* Заголовок строки */}
        <div style={styles.rowHeader}>
          <div style={styles.rowTitle}>
            <span style={styles.targetLabel}>
              Жалоба на {TARGET_TYPE_LABEL[report.targetTypeId]} #
              {report.targetId}
            </span>
            <span style={styles.reasonChip}>{reasonLabel}</span>
            {report.taskStatusId !== null && (
              <span
                style={{
                  ...styles.statusChip,
                  ...(isInProgress ? styles.statusInProgress : {}),
                  ...(report.taskStatusId === TASK_STATUS.ACCEPTED
                    ? styles.statusAccepted
                    : {}),
                  ...(report.taskStatusId === TASK_STATUS.REJECTED
                    ? styles.statusRejected
                    : {}),
                }}
              >
                {TASK_STATUS_LABEL[report.taskStatusId]}
              </span>
            )}
          </div>

          <div style={styles.rowMeta}>
            <span style={styles.muted}>
              {report.count} жал. · первая {formatDate(report.firstReportDate)}{' '}
              · последняя {formatDate(report.lastReportDate)}
            </span>
          </div>
        </div>

        {/* Кнопки действий */}
        <div style={styles.rowActions}>
          <button
            style={styles.actionBtn}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Скрыть инфо' : 'Показать инфо'}
          </button>

          <button style={styles.actionBtn} onClick={() => setModalOpen(true)}>
            Жалобы
          </button>

          {isFree && (
            <button
              style={{ ...styles.actionBtn, ...styles.primaryBtn }}
              onClick={handleTakeTask}
              disabled={isActionLoading}
            >
              {createTask.isPending ? '...' : 'Взять в обработку'}
            </button>
          )}

          {isInProgress && (
            <>
              <button
                style={{ ...styles.actionBtn, ...styles.acceptBtn }}
                onClick={() => handleResolve(true)}
                disabled={isActionLoading}
              >
                {resolveTask.isPending ? '...' : 'Принять'}
              </button>
              <button
                style={{ ...styles.actionBtn, ...styles.rejectBtn }}
                onClick={() => handleResolve(false)}
                disabled={isActionLoading}
              >
                {resolveTask.isPending ? '...' : 'Отклонить'}
              </button>
            </>
          )}

          {isResolved && (
            <span style={styles.resolvedInfo}>
              Решено: {formatDate(report.taskResolvedAt)}
            </span>
          )}
        </div>

        {/* Раскрывающаяся панель с инфо о таргете */}
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

// ─── ModerationPage ───────────────────────────────────────────────────────────

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

  // Sentinel для IntersectionObserver (автоподгрузка при скролле)
  const sentinelRef = useRef<HTMLDivElement>(null);
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
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Панель модерации</h1>

      {/* ── Фильтры ── */}
      <div style={styles.filtersBar}>
        {/* Статус */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Статус</label>
          <select
            style={styles.select}
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
            <option value="resolved">Обработанные</option>
          </select>
        </div>

        {/* Тип контента */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Тип контента</label>
          <select
            style={styles.select}
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

        {/* Тип жалобы */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Тип жалобы</label>
          <select
            style={styles.select}
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
          style={{ ...styles.actionBtn, ...styles.primaryBtn }}
          onClick={applyFilters}
        >
          Применить
        </button>
        <button style={styles.actionBtn} onClick={resetFilters}>
          Сбросить
        </button>
      </div>

      {/* ── Список ── */}
      <div style={styles.list}>
        {isLoading && <div style={styles.hint}>Загрузка...</div>}
        {isError && (
          <div style={styles.errorHint}>
            Ошибка загрузки.{' '}
            <button style={styles.linkBtn} onClick={() => refetch()}>
              Повторить
            </button>
          </div>
        )}

        {!isLoading && allReports.length === 0 && (
          <div style={styles.hint}>Жалоб не найдено</div>
        )}

        {allReports.map((report) => (
          <ReportRow
            key={`${report.targetId}-${report.targetTypeId}-${report.reasonTypeId}`}
            report={report}
            onUpdated={refetch}
          />
        ))}

        {/* Sentinel для автоподгрузки */}
        <div ref={setSentinel} style={{ height: 1 }} />

        {isFetchingNextPage && (
          <div style={styles.hint}>Загрузка следующей страницы...</div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#1a1a2e',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
  },
  filtersBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-end',
    padding: '16px',
    background: '#f5f5f7',
    borderRadius: 10,
    marginBottom: 20,
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 500,
  },
  select: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #d0d0d8',
    fontSize: 14,
    background: '#fff',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  row: {
    border: '1px solid #e0e0ea',
    borderRadius: 10,
    padding: '14px 16px',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  rowHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 10,
  },
  rowTitle: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  targetLabel: {
    fontWeight: 600,
    fontSize: 15,
  },
  rowMeta: {
    fontSize: 13,
  },
  rowActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #d0d0d8',
    background: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    color: '#333',
  },
  primaryBtn: {
    background: '#2563eb',
    border: '1px solid #2563eb',
    color: '#fff',
  },
  acceptBtn: {
    background: '#16a34a',
    border: '1px solid #16a34a',
    color: '#fff',
  },
  rejectBtn: {
    background: '#dc2626',
    border: '1px solid #dc2626',
    color: '#fff',
  },
  chip: {
    background: '#f0f0f5',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 12,
    color: '#555',
  },
  reasonChip: {
    background: '#eff6ff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    color: '#2563eb',
    border: '1px solid #bfdbfe',
  },
  statusChip: {
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    border: '1px solid transparent',
  },
  statusInProgress: {
    background: '#fefce8',
    color: '#ca8a04',
    border: '1px solid #fde68a',
  },
  statusAccepted: {
    background: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
  },
  statusRejected: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
  },
  resolvedInfo: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  muted: {
    color: '#888',
    fontSize: 13,
  },
  hint: {
    color: '#888',
    fontSize: 14,
    padding: '12px 0',
    textAlign: 'center',
  },
  errorHint: {
    color: '#dc2626',
    fontSize: 14,
    padding: '12px 0',
    textAlign: 'center',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: 'inherit',
    padding: 0,
  },
  targetPanel: {
    marginTop: 12,
    padding: '12px 14px',
    background: '#f8f8fc',
    borderRadius: 8,
    border: '1px solid #e8e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  targetField: {
    display: 'flex',
    gap: 8,
    fontSize: 14,
  },
  fieldLabel: {
    fontWeight: 600,
    color: '#555',
    minWidth: 80,
    flexShrink: 0,
  },
  targetDescription: {
    color: '#333',
    lineHeight: 1.5,
  },
  bookLink: {
    display: 'inline-block',
    marginTop: 4,
    color: '#2563eb',
    fontSize: 13,
    textDecoration: 'none',
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 560,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8f0',
  },
  modalTitle: {
    fontWeight: 600,
    fontSize: 16,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#888',
    padding: '0 4px',
  },
  modalBody: {
    overflowY: 'auto',
    padding: '12px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  reportItem: {
    padding: '10px 12px',
    background: '#f8f8fc',
    borderRadius: 8,
    border: '1px solid #e8e8f0',
  },
  reportMeta: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  reportText: {
    fontSize: 14,
    color: '#333',
    margin: 0,
    lineHeight: 1.5,
  },
  loadMoreBtn: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #d0d0d8',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    alignSelf: 'center',
  },
};
