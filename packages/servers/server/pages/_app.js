/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import React, { useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

import { ErrorBoundary } from '@lowdefy/block-utils';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme as antdTheme } from 'antd';

import Auth from '../lib/client/auth/Auth.js';
import createLogUsage from '../lib/client/createLogUsage.js';
import initSentryClient from '../lib/client/sentry/initSentryClient.js';
import loggerConfig from '../lib/build/logger.js';
import setSentryUser from '../lib/client/sentry/setSentryUser.js';

// Must be in _app due to next specifications.
import '../build/globals.css';

// Initialize Sentry client once on module load
initSentryClient({
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sentryConfig: loggerConfig.sentry,
});

const algorithmMap = {
  default: antdTheme.defaultAlgorithm,
  dark: antdTheme.darkAlgorithm,
  compact: antdTheme.compactAlgorithm,
};

function resolveAlgorithm(algorithm) {
  if (Array.isArray(algorithm)) {
    return algorithm.map((a) => algorithmMap[a] || antdTheme.defaultAlgorithm);
  }
  return algorithmMap[algorithm] || antdTheme.defaultAlgorithm;
}

function App({ Component, pageProps: { session, rootConfig, pageConfig } }) {
  const usageDataRef = useRef({});
  const lowdefyRef = useRef({ eventCallback: createLogUsage({ usageDataRef }) });

  if (rootConfig?.theme) {
    lowdefyRef.current.theme = rootConfig.theme;
  }

  const handleError = useCallback((error) => {
    if (lowdefyRef.current?._internal?.handleError) {
      lowdefyRef.current._internal.handleError(error);
    } else {
      console.error(error);
    }
  }, []);

  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={{
          ...lowdefyRef.current.theme?.antd,
          cssVar: { key: 'lowdefy' },
          hashed: false,
          algorithm: resolveAlgorithm(lowdefyRef.current.theme?.antd?.algorithm),
        }}
      >
        <ErrorBoundary fullPage onError={handleError}>
          <Auth session={session}>
            {(auth) => {
              usageDataRef.current.user = auth.session?.hashed_id;
              // Set Sentry user context when auth changes
              setSentryUser({
                user: auth.session,
                sentryConfig: loggerConfig.sentry,
              });
              return (
                <Component
                  auth={auth}
                  lowdefy={lowdefyRef.current}
                  rootConfig={rootConfig}
                  pageConfig={pageConfig}
                />
              );
            }}
          </Auth>
        </ErrorBoundary>
      </ConfigProvider>
    </StyleProvider>
  );
}

const DynamicApp = dynamic(() => Promise.resolve(App), {
  ssr: false,
});

export default DynamicApp;
