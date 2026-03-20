import { useQuery } from "@tanstack/react-query";
import { getWorkerDashboard } from "@workspace/api-client-react";
import { getAuthHeaders } from "./use-auth";

export function useDashboard(workerId: number) {
  return useQuery({
    queryKey: ["dashboard", workerId],
    queryFn: () => getWorkerDashboard(workerId, { headers: getAuthHeaders() }),
    enabled: !!workerId,
    refetchInterval: 30000, // Refetch every 30s for real-time feel
  });
}
