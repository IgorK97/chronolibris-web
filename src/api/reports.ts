import { apiClient } from './apiClient';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

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

export const reportsApi = {
  // POST /api/reports
  createReport: (data: CreateReportRequest) =>
    apiClient.post<void, CreateReportRequest>('/reports', data),

  // GET /api/reports/reports
  getReports: (params: GetReportsRequest) =>
    apiClient.get<GetReportsResponse, GetReportsRequest>(
      '/reports/reports',
      params
    ),

  getTargetInfo: (targetTypeId: number, targetId: number) =>
    apiClient.get<TargetInfoResponse>(
      `/reports/targets/${targetTypeId}/${targetId}`
    ),

  getTargetReports: (params: {
    targetId: number;
    targetTypeId: number;
    reasonTypeId: number;
    count: number;
    lastReportId?: number;
  }) =>
    apiClient.get<GetTargetReportsResponse, typeof params>(
      '/reports/reports/target',
      params
    ),

  // POST /api/reports/tasks
  createModerationTask: (data: {
    targetId: number;
    targetTypeId: number;
    reportTypeId: number;
  }) =>
    apiClient.post<CreateModerationTaskResponse, typeof data>(
      '/reports/tasks',
      data
    ),

  // PATCH /api/reports/tasks/{id}/resolution
  resolveTask: (taskId: number, resolution: boolean, reportText: string) =>
    apiClient.put<
      TaskResolutionResponse,
      { id: number; resolution: boolean; comment: string }
    >(`/reports/tasks/${taskId}/resolution`, {
      id: taskId,
      resolution,
      comment: reportText,
    }),
};

const PAGE_SIZE = 20;

export const useInfiniteReports = (
  filters: Omit<GetReportsRequest, 'lastDate' | 'count'>
) => {
  return useInfiniteQuery({
    queryKey: ['moderation', 'reports', filters],
    queryFn: ({ pageParam }) =>
      reportsApi.getReports({
        ...filters,
        count: PAGE_SIZE,
        lastDate: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext
        ? lastPage.reports[lastPage.reports.length - 1]?.firstReportDate
        : undefined,
  });
};

export const useTargetInfo = (
  targetTypeId: number,
  targetId: number,
  enabled: boolean
) => {
  return useQuery({
    queryKey: ['moderation', 'target', targetTypeId, targetId],
    queryFn: () => reportsApi.getTargetInfo(targetTypeId, targetId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useInfiniteTargetReports = (
  params: { targetId: number; targetTypeId: number; reasonTypeId: number },
  enabled: boolean
) => {
  return useInfiniteQuery({
    queryKey: ['moderation', 'targetReports', params],
    queryFn: ({ pageParam }) =>
      reportsApi.getTargetReports({
        ...params,
        count: 10,
        lastReportId: pageParam as number | undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.lastReportId : undefined,
    enabled,
  });
};

export const useCreateModerationTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reportsApi.createModerationTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });
};

export const useResolveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      resolution,
      reportText,
    }: {
      taskId: number;
      resolution: boolean;
      reportText: string;
    }) => reportsApi.resolveTask(taskId, resolution, reportText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation', 'reports'] });
    },
  });
};

export const useCreateReport = () => {
  return useMutation({
    mutationFn: reportsApi.createReport,
  });
};
