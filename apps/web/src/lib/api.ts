import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createApiClient } from '@productiveme/api-client';
import type { DomainId } from '../types.js';

const domainApiIds: Record<DomainId, 'career' | 'finance' | 'personal-data' | 'life'> = {
  career: 'career',
  finance: 'finance',
  pdata: 'personal-data',
  life: 'life',
};

const apiBaseUrl = new URL(
  import.meta.env.VITE_API_BASE_URL ?? '/api',
  window.location.origin,
).toString();

export const apiClient = createApiClient(apiBaseUrl);
export const ApiContext = createContext(apiClient);

export function useApi() {
  return useContext(ApiContext);
}

export function useDomainRollups() {
  const api = useApi();
  return useQuery({ queryKey: ['domains'], queryFn: () => api.getDomains() });
}

export function useSignals() {
  const api = useApi();
  return useQuery({ queryKey: ['signals'], queryFn: () => api.getSignals() });
}

export function useDomainSignals(domain: DomainId) {
  const api = useApi();
  const apiDomainId = domainApiIds[domain];
  return useQuery({
    queryKey: ['signals', apiDomainId],
    queryFn: async () => (await api.getSignals()).filter((signal) => signal.domain === apiDomainId),
  });
}

export function useRegistry() {
  const api = useApi();
  return useQuery({ queryKey: ['registry'], queryFn: () => api.getRegistry() });
}

export function useDomainSnapshots(domain: DomainId) {
  const api = useApi();
  return useQuery({
    queryKey: ['snapshots', domainApiIds[domain]],
    queryFn: () => api.getSnapshots({ domain: domainApiIds[domain] }),
  });
}

export function toApiDomainId(domain: DomainId) {
  return domainApiIds[domain];
}
