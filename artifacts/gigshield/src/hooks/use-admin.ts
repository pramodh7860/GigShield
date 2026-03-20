import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetOverview, adminListWorkers, adminListTriggers, adminListClaims, adminUpdateClaim, createTrigger } from "@workspace/api-client-react";
import { getAuthHeaders } from "./use-auth";

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminGetOverview({ headers: getAuthHeaders() }),
  });
}

export function useAdminWorkers(params?: { search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["admin", "workers", params],
    queryFn: () => adminListWorkers(params, { headers: getAuthHeaders() }),
  });
}

export function useAdminClaims(params?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["admin", "claims", params],
    queryFn: () => adminListClaims(params, { headers: getAuthHeaders() }),
  });
}

export function useAdminUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      adminUpdateClaim(id, { status: status as any, notes }, { headers: getAuthHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

export function useAdminTriggers() {
  return useQuery({
    queryKey: ["admin", "triggers"],
    queryFn: () => adminListTriggers(undefined, { headers: getAuthHeaders() }),
  });
}

export function useSimulateTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; zone: string; description: string; severity: string; rainfallMm?: number; temperatureCelsius?: number; orderDropPercent?: number }) =>
      createTrigger(data as any, { headers: getAuthHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "triggers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
    },
  });
}
