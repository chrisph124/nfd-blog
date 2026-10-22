import type { Metadata } from 'next';

export const getOpenGraphType = (openGraph: Metadata['openGraph']): string | undefined =>
  openGraph && 'type' in openGraph ? openGraph.type : undefined;
