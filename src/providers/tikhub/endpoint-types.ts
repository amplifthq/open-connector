import type { TikHubEndpointMethod } from "./endpoint-policy.ts";

export interface TikHubDiscoveredEndpoint {
  category: string;
  title: string;
  description: string;
  operationId: string;
  method: TikHubEndpointMethod;
  path: string;
  requiredScope: string;
  contractHash: string;
  requestSchema: Record<string, unknown>;
}

export interface TikHubDiscoverInput {
  query?: string;
  category?: string;
  cursor?: string | null;
  limit?: number;
}

export interface TikHubDiscoverResult {
  catalogVersion: string;
  endpoints: TikHubDiscoveredEndpoint[];
  nextCursor: string | null;
  stale: boolean;
}
