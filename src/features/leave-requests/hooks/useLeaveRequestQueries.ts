import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as leaveRequestService from '../services/leave-request.service';
import type { LeaveRequestListParams } from '../types/leave-request.type';

export const leaveRequestKeys = {
  all: ['admin', 'leave-applications'] as const,
  list: (params: LeaveRequestListParams) =>
    ['admin', 'leave-applications', 'list', params] as const,
  detail: (id: number) =>
    ['admin', 'leave-applications', 'detail', id] as const,
  pendingCount: ['admin', 'leave-applications', 'pending-count'] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function usePendingLeaveRequestCountQuery(enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: leaveRequestKeys.pendingCount,
    enabled: enabled && Boolean(token),
    queryFn: () =>
      leaveRequestService.getPendingLeaveRequestCount(requireToken(token)),
    refetchInterval: 60_000,
  });
}

export function useLeaveRequestsQuery(
  params: LeaveRequestListParams,
  enabled = true,
) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: leaveRequestKeys.list(params),
    enabled: enabled && Boolean(token),
    queryFn: () =>
      leaveRequestService.listLeaveRequests(requireToken(token), params),
  });
}

export function useLeaveRequestQuery(id?: number, enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: leaveRequestKeys.detail(id ?? 0),
    enabled: enabled && Boolean(token) && Boolean(id),
    queryFn: () =>
      leaveRequestService.getLeaveRequest(requireToken(token), id as number),
  });
}

export function useApproveLeaveRequestMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      leaveRequestService.approveLeaveRequest(requireToken(token), id),
    onSuccess: async (record) => {
      queryClient.setQueryData(leaveRequestKeys.detail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
}

export function useRejectLeaveRequestMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decisionNote }: { id: number; decisionNote: string }) =>
      leaveRequestService.rejectLeaveRequest(
        requireToken(token),
        id,
        decisionNote,
      ),
    onSuccess: async (record) => {
      queryClient.setQueryData(leaveRequestKeys.detail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
}
