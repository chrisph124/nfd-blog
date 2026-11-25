'use client';

import { useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

export default function DatadogRUM() {
  useEffect(() => {
    const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;
    const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
    const site = process.env.NEXT_PUBLIC_DD_SITE || 'datadoghq.com';
    const env = process.env.NEXT_PUBLIC_DD_ENV || process.env.NODE_ENV;
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

    if (!applicationId || !clientToken) {
      console.log('[Datadog] RUM not initialized - missing credentials');
      return;
    }

    datadogRum.init({
      applicationId,
      clientToken,
      site,
      service: 'nfd-blog',
      env,
      version,
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
      allowedTracingUrls: [window.location.origin],
    });

    datadogLogs.init({
      clientToken,
      site,
      service: 'nfd-blog',
      env,
      version,
      forwardErrorsToLogs: true,
      forwardConsoleLogs: ['error', 'warn'],
      sessionSampleRate: 100,
    });

    datadogRum.setGlobalContextProperty('app', 'nfd-blog');
    datadogRum.setGlobalContextProperty('framework', 'nextjs-15');
  }, []);

  return null;
}
