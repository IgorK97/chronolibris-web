import type {
  CreateModerationTaskResponse,
  CreateReportRequest,
  GetReportsRequest,
  GetReportsResponse,
  GetTargetReportsResponse,
  TargetInfoResponse,
  TaskResolutionResponse,
} from '@/types';
import { apiClient } from './apiClient';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

export const reportsApi = {
  createReport: (data: CreateReportRequest) =>
    apiClient.post<void, CreateReportRequest>('/reports', data), //Так-то хотел результат получать,
  //но по факту это делается через исключение. Потом исправить

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

  createModerationTask: (data: {
    targetId: number;
    targetTypeId: number;
    reportTypeId: number;
  }) =>
    apiClient.post<CreateModerationTaskResponse, typeof data>(
      '/reports/tasks',
      data
    ),

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
