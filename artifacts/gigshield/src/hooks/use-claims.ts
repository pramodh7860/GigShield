import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClaims, getClaim, adminListClaims, adminUpdateClaim } from "@workspace/api-client-react";
import type { AdminUpdateClaimRequest, ListClaimsParams } from "@workspace/api-client-react/src/generated/api.schemas";
import { getAuthHeaders } from "./use-auth";

export function useWorkerClaims(params?: ListClaimsParams) {
  return useQuery({
    queryKey: ["claims", params],
    queryFn: () => listClaims(params, { headers: getAuthHeaders() }),
  });
}

export function useClaim(id: number) {
  return useQuery({
    queryKey: ["claims", id],
    queryFn: () => getClaim(id, { headers: getAuthHeaders() }),
    enabled: !!id,
  });
}

export function useAdminClaims() {
  return useQuery({
    queryKey: ["admin", "claims"],
    queryFn: () => adminListClaims(undefined, { headers: getAuthHeaders() }),
  });
}

export function useAdminUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminUpdateClaimRequest }) =>
      adminUpdateClaim(id, data, { headers: getAuthHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}
