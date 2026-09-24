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
import useSWR from 'swr';

import { ErrorBoundary } from '@lowdefy/block-utils';
import { useDarkMode, useLocale } from '@lowdefy/client';
import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntdApp, theme as antdTheme } from 'antd';
import { XProvider } from '@ant-design/x';

import antdLocaleLoaders from '../build/i18n/antdLocales.js';
import antdXLocaleLoaders from '../build/i18n/antdXLocales.js';
import dayjsLocaleMap from '../build/i18n/dayjsLocales.js';
import Auth from '../lib/client/auth/Auth.jsx';
import ErrorBar from '../lib/client/ErrorBar.jsx';
import request from '../lib/client/utils/request.js';
import Routing from './Routing.jsx';

function ThemeTokenResolver({ lowdefyRef, children }) {
  const { token } = antdTheme.useToken();
  if (!lowdefyRef.current.theme) {
    lowdefyRef.current.theme = {};
  }
  lowdefyRef.current.theme._resolvedAntdToken = token;
  return children;
}

function App({ config, router }) {
  const lowdefyRef = useRef({});
  const [runtimeErrors, setRuntimeErrors] = useState([]);
  // Subscribe to rootConfig SWR cache — deduplicates with Routing's fetch.
  // Without suspense so App doesn't suspend — just re-renders when data arrives.
  const { data: rootConfig } = useSWR(`${router.basePath}/api/root`, (url) => request({ url }));
  if (rootConfig?.theme) {
    lowdefyRef.current.theme = rootConfig.theme;
  }

  const { algorithm, token, components } = useDarkMode({
    antd: lowdefyRef.current.theme?.antd,
    configDarkMode: lowdefyRef.current.theme?.darkMode,
  });

  const {
    active: activeLocale,
    antdLocale,
    antdXLocale,
  } = useLocale({
    i18n: rootConfig?.i18n,
    antdLocaleLoaders,
    antdXLocaleLoaders,
    dayjsLocaleMap,
  });

  if (rootConfig?.i18n?.defaultLocale) {
    lowdefyRef.current.i18n = { ...rootConfig.i18n, active: activeLocale };
  }

  const {
    lightToken: _lightToken,
    darkToken: _darkToken,
    lightComponents: _lightComponents,
    darkComponents: _darkComponents,
    ...antdConfig
  } = lowdefyRef.current.theme?.antd ?? {};

  // Runtime error callback — pushes errors to state for ErrorBar display.
  // Accepts Error objects (with .name) or plain objects (with .type) from build warnings.
  lowdefyRef.current._runtimeErrorCallback = useCallback((error) => {
    setRuntimeErrors((prev) => [
      ...prev,
      {
        type: error.type ?? error.name,
        message: error.message,
        source: error.source,
        stack: error.stack,
        prodError: error.prodError === true,
      },
    ]);
  }, []);

  // Clear runtime errors on navigation
  useEffect(() => {
    return router.subscribe(() => setRuntimeErrors([]));
  }, [router]);

  const handleError = useCallback((error) => {
    if (lowdefyRef.current?._internal?.handleError) {
      lowdefyRef.current._internal.handleError(error);
    } else {
      console.error(error);
    }
  }, []);

  // XProvider extends antd's ConfigProvider; merging antd + antd-X locale packs
  // gives X components (Bubble, Sender, Conversations, ...) their built-in strings
  // alongside antd's. antd X ships only en_US + zh_CN; other locales fall back
  // to en_US for X-native strings.
  const mergedLocale =
    antdLocale || antdXLocale ? { ...(antdLocale ?? {}), ...(antdXLocale ?? {}) } : undefined;

  return (
    <StyleProvider layer>
      <XProvider
        locale={mergedLocale}
        form={
          antdLocale?.Form?.defaultValidateMessages
            ? { validateMessages: antdLocale.Form.defaultValidateMessages }
            : undefined
        }
        theme={{
          ...antdConfig,
          token,
          components,
          cssVar: { key: 'lowdefy' },
          hashed: false,
          algorithm,
        }}
      >
        <AntdApp>
          <ThemeTokenResolver lowdefyRef={lowdefyRef}>
            <ErrorBoundary fullPage onError={handleError}>
              <Suspense
                fallback={
                  <div
                    style={{
                      minHeight: '100vh',
                      background: 'var(--ant-color-bg-layout)',
                    }}
                  />
                }
              >
                <Auth user={config?.user}>
                  {(auth) => {
                    return <Routing auth={auth} lowdefy={lowdefyRef.current} router={router} />;
                  }}
                </Auth>
              </Suspense>
            </ErrorBoundary>
            <ErrorBar errors={runtimeErrors} />
          </ThemeTokenResolver>
        </AntdApp>
      </XProvider>
    </StyleProvider>
  );
}

export default App;
