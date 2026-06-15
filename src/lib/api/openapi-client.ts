import createClient from 'openapi-fetch';

import type { paths } from '@/types/api.generated';
import { getApiBaseUrl } from '../api-fetch';

export type ApiPaths = paths;

export function createApiClient(accessToken?: string) {
  const client = createClient<paths>({ baseUrl: getApiBaseUrl() });

  if (accessToken) {
    client.use({
      onRequest({ request }) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
        return request;
      },
    });
  }

  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
