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

import { ErrorBoundary } from '@lowdefy/block-utils';
import { useDarkMode, useLocale } from '@lowdefy/client';
import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntdApp, theme as antdTheme } from 'antd';
import { XProvider } from '@ant-design/x';

import { serializer } from '@lowdefy/helpers';

import antdLocaleLoaders from '../build/i18n/antdLocales.js';
import antdXLocaleLoaders from '../build/i18n/antdXLocales.js';
import dayjsLocaleMap from '../build/i18n/dayjsLocales.js';
import rawLoggerConfig from '../build/logger.json';
import Auth from '../lib/client/auth/Auth.jsx';
import createLogUsage from '../lib/client/createLogUsage.js';
import initSentryClient from '../lib/client/sentry/initSentryClient.js';
import setSentryUser from '../lib/client/sentry/setSentryUser.js';
import Page from './Page.jsx';

// Deserialize to restore arrays (e.g. sentry.userFields) from ~arr markers.
const loggerConfig = serializer.deserialize(rawLoggerConfig);

function ThemeTokenResolver({ lowdefyRef, children }) {
  const { token } = antdTheme.useToken();
  if (!lowdefyRef.current.theme) {
    lowdefyRef.current.theme = {};
  }
  lowdefyRef.current.theme._resolvedAntdToken = token;
  return children;
}

function App({ config }) {
  const { rootConfig, user } = config;

  // Sentry DSN arrives at runtime via the embedded config (the server reads
  // SENTRY_DSN per process) — no build-time env inlining.
  initSentryClient({
    sentryDsn: config.sentryDsn,
    sentryConfig: loggerConfig.sentry,
  });

  const usageDataRef = useRef({});
  // journeys is the app's logger.journeys policy, read by the journey recorder
  // that initLowdefyContext builds on this same object.
  const lowdefyRef = useRef({
    eventCallback: createLogUsage({ usageDataRef }),
    journeys: loggerConfig.journeys,
  });
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
              <Auth user={user}>
                {(auth) => {
                  usageDataRef.current.user = auth.user?.id;
                  // Set Sentry user context when auth changes
                  setSentryUser({
                    user: auth.user,
                    sentryConfig: loggerConfig.sentry,
                  });
                  return <Page auth={auth} config={config} lowdefy={lowdefyRef.current} />;
                }}
              </Auth>
            </ErrorBoundary>
          </ThemeTokenResolver>
        </AntdApp>
      </XProvider>
    </StyleProvider>
  );
}

export default App;
