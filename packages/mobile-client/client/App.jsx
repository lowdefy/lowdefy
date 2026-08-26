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
import { ConfigProvider } from 'antd-mobile';
import { ErrorBoundary } from '@lowdefy/block-utils';
// Direct file import — the package index also exports useDarkMode, which
// would pull antd into the mobile bundle graph.
import useLocale from '@lowdefy/client/useLocale.js';

import antdMobileLocaleLoaders, { enUS } from './antdMobileLocales.js';
import Auth from './auth/Auth.jsx';
import Page from './Page.jsx';
import useMobileDarkMode from './useMobileDarkMode.js';

function App({ apiBase, rootConfig, session }) {
  const lowdefyRef = useRef({});
  if (rootConfig?.theme) {
    lowdefyRef.current.theme = rootConfig.theme;
  }

  // antd-mobile theming is CSS variables (build/mobile/theme.css) — the hook
  // only resolves and stamps the dark mode attribute on <html>.
  useMobileDarkMode({ configDarkMode: rootConfig?.theme?.darkMode });

  // Same resolve order as web (stored preference > browser languages >
  // defaultLocale) via the shared hook, loading antd-mobile locale packs.
  const { active: activeLocale, antdLocale } = useLocale({
    i18n: rootConfig?.i18n,
    antdLocaleLoaders: antdMobileLocaleLoaders,
  });
  if (rootConfig?.i18n?.defaultLocale) {
    lowdefyRef.current.i18n = { ...rootConfig.i18n, active: activeLocale };
  }

  const handleError = useCallback((error) => {
    if (lowdefyRef.current?._internal?.handleError) {
      lowdefyRef.current._internal.handleError(error);
    } else {
      console.error(error);
    }
  }, []);

  return (
    <ConfigProvider locale={antdLocale ?? enUS}>
      {/* Safe-area chrome — status bar / notch / home indicator insets. */}
      <div
        style={{
          minHeight: '100vh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <ErrorBoundary fullPage onError={handleError}>
          <Auth apiBase={apiBase} serverSession={session}>
            {(auth) => (
              <Page
                apiBase={apiBase}
                auth={auth}
                lowdefy={lowdefyRef.current}
                rootConfig={rootConfig}
              />
            )}
          </Auth>
        </ErrorBoundary>
      </div>
    </ConfigProvider>
  );
}

export default App;
