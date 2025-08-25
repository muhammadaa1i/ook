"use client";
import React from 'react';
import { SWRConfig } from 'swr';
import modernApiClient from '@/lib/modernApiClient';

const fetcher = (endpoint: string, params?: Record<string, unknown>) => modernApiClient.get(endpoint, params, { cache: true });

export function GlobalSWRConfig({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{
      fetcher: (key: string) => fetcher(key),
      dedupingInterval: 4000, // avoid bursts
      revalidateOnFocus: false,
      revalidateIfStale: true,
      shouldRetryOnError: (err) => {
        if (!err || typeof err !== 'object') return false;
        const status = (err as { status?: number }).status;
        return status ? status >= 500 : false;
      },
      errorRetryCount: 2,
      errorRetryInterval: 2000,
    }}>
      {children}
    </SWRConfig>
  );
}

export default GlobalSWRConfig;
