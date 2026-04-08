export interface ReportShortDto {
  targetId: number;
  targetTypeId: number;
  reasonTypeId: number;
  count: number;
  firstReportDate: string;
  lastReportDate: string;
  moderationTaskId: number | null;
  taskCreatedAt: string | null;
  taskResolvedAt: string | null;
  taskStatusId: number | null;
  comment: string;
  ModerationTaskId: string;
}

export interface GetReportsResponse {
  reports: ReportShortDto[];
  hasNext: boolean;
  count: number;
  lastTargetId: number;
  lastTargetTypeId: number;
  lastReportTypeId: number;
}

export interface GetReportsRequest {
  lastTargetId?: number;
  lastTargetTypeId?: number;
  lastReportTypeId?: number;
  count: number;
  targetTypeFilter: boolean;
  reportTypeFilter: boolean;
  reportStatusFilter: boolean;
  reportStatusId?: number | null;
  lastDate?: string;
}

export interface TargetInfoResponse {
  targetId: number;
  targetTypeId: number;
  text: string | null;
  readerId: number | null;
  bookTitle: string | null;
  bookDescription: string | null;
  bookId: number | null;
  parentCommentText: string | null;
}

export interface ReportDto {
  id: number;
  reporterId: number;
  text: string;
  createdAt: string;
}

export interface GetTargetReportsResponse {
  reports: ReportDto[];
  hasNext: boolean;
  count: number;
  lastReportId: number;
}

export interface CreateModerationTaskResponse {
  id: number | null;
  taskCreatedAt: string | null;
  taskStatusId: number;
}

export interface TaskResolutionResponse {
  success: boolean;
  taskResolvedAt: string | null;
  taskStatusId: number | null;
}

export interface CreateReportRequest {
  targetId: number;
  targetTypeId: number;
  reasonTypeId: number;
  description?: string;
}

export const TASK_STATUS = {
  IN_PROGRESS: 2,
  ACCEPTED: 3,
  REJECTED: 4,
} as const;

export const TARGET_TYPE = {
  BOOK: 1,
  COMMENT: 2,
  REVIEW: 3,
} as const;

export const TARGET_TYPE_LABEL: Record<number, string> = {
  [TARGET_TYPE.BOOK]: 'Книгу',
  [TARGET_TYPE.COMMENT]: 'Комментарий',
  [TARGET_TYPE.REVIEW]: 'Отзыв',
};

export const TASK_STATUS_LABEL: Record<number, string> = {
  [TASK_STATUS.IN_PROGRESS]: 'В обработке',
  [TASK_STATUS.ACCEPTED]: 'Принята',
  [TASK_STATUS.REJECTED]: 'Отклонена',
};
