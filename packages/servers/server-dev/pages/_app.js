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

import React, { Suspense, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

import { ErrorBoundary } from '@lowdefy/block-utils';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme as antdTheme } from 'antd';

import Auth from '../lib/client/auth/Auth.js';

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

function App({ Component }) {
  const lowdefyRef = useRef({});

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
          cssVar: { key: ',:root' },
          hashed: false,
          algorithm: resolveAlgorithm(lowdefyRef.current.theme?.antd?.algorithm),
        }}
      >
        <ErrorBoundary fullPage onError={handleError}>
          <Suspense fallback="">
            <Auth>
              {(auth) => {
                return <Component auth={auth} lowdefy={lowdefyRef.current} />;
              }}
            </Auth>
          </Suspense>
        </ErrorBoundary>
      </ConfigProvider>
    </StyleProvider>
  );
}

const DynamicApp = dynamic(() => Promise.resolve(App), {
  ssr: false,
});

export default DynamicApp;
