import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPolicies, createPolicy, getWorkerPolicies } from "@workspace/api-client-react";
import type { CreatePolicyRequest } from "@workspace/api-client-react/src/generated/api.schemas";
import { getAuthHeaders } from "./use-auth";

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => listPolicies({ headers: getAuthHeaders() }),
  });
}

export function useWorkerPolicies(workerId: number) {
  return useQuery({
    queryKey: ["policies", workerId],
    queryFn: () => getWorkerPolicies(workerId, { headers: getAuthHeaders() }),
    enabled: !!workerId,
  });
}

export function useSubscribeToPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePolicyRequest) => createPolicy(data, { headers: getAuthHeaders() }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", variables.workerId] });
      queryClient.invalidateQueries({ queryKey: ["policies", variables.workerId] });
    },
  });
}
