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

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import { ErrorBoundary } from '@lowdefy/block-utils';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme as antdTheme } from 'antd';

import Auth from '../lib/client/auth/Auth.js';
import ErrorBar from '../lib/client/ErrorBar.js';
import request from '../lib/client/utils/request.js';

// Must be in _app due to next specifications.
import '../build/globals.css';

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

function ThemeTokenResolver({ lowdefyRef, children }) {
  const { token } = antdTheme.useToken();
  if (!lowdefyRef.current.theme) {
    lowdefyRef.current.theme = {};
  }
  lowdefyRef.current.theme._resolvedAntdToken = token;
  return children;
}

function App({ Component }) {
  const router = useRouter();
  const lowdefyRef = useRef({});
  const [runtimeErrors, setRuntimeErrors] = useState([]);

  // Subscribe to rootConfig SWR cache — deduplicates with inner App.js fetch.
  // Without suspense so _app.js doesn't suspend — just re-renders when data arrives.
  const { data: rootConfig } = useSWR(`${router.basePath}/api/root`, (url) => request({ url }));
  if (rootConfig?.theme) {
    lowdefyRef.current.theme = rootConfig.theme;
  }

  // Runtime error callback — pushes errors to state for ErrorBar display.
  // Accepts Error objects (with .name) or plain objects (with .type) from build warnings.
  lowdefyRef.current._runtimeErrorCallback = useCallback((error) => {
    setRuntimeErrors((prev) => [
      ...prev,
      {
        type: error.type ?? error.name,
        message: error.message,
        source: error.source,
      },
    ]);
  }, []);

  // Clear runtime errors on route change
  useEffect(() => {
    const clearErrors = () => setRuntimeErrors([]);
    router.events.on('routeChangeStart', clearErrors);
    return () => router.events.off('routeChangeStart', clearErrors);
  }, [router.events]);

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
        <ThemeTokenResolver lowdefyRef={lowdefyRef}>
          <ErrorBoundary fullPage onError={handleError}>
            <Suspense fallback="">
              <Auth>
                {(auth) => {
                  return <Component auth={auth} lowdefy={lowdefyRef.current} />;
                }}
              </Auth>
            </Suspense>
          </ErrorBoundary>
          <ErrorBar errors={runtimeErrors} />
        </ThemeTokenResolver>
      </ConfigProvider>
    </StyleProvider>
  );
}

const DynamicApp = dynamic(() => Promise.resolve(App), {
  ssr: false,
});

export default DynamicApp;
