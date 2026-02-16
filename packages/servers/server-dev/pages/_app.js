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

import { errorToDisplayString } from '@lowdefy/errors';

import Auth from '../lib/client/auth/Auth.js';
import initSentryClient from '../lib/client/sentry/initSentryClient.js';
import loggerConfig from '../lib/build/logger.js';
import setSentryUser from '../lib/client/sentry/setSentryUser.js';

// Must be in _app due to next specifications.
import '../build/plugins/styles.less';

// Initialize Sentry client once on module load
initSentryClient({
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sentryConfig: loggerConfig.sentry,
});

function App({ Component }) {
  const lowdefyRef = useRef({});

  const handleError = useCallback((error) => {
    if (lowdefyRef.current?._internal?.handleError) {
      lowdefyRef.current._internal.handleError(error);
    } else {
      console.error(errorToDisplayString(error));
    }
  }, []);

  return (
    <ErrorBoundary fullPage onError={handleError}>
      <Suspense fallback="">
        <Auth>
          {(auth) => {
            // Set Sentry user context when auth changes
            setSentryUser({
              user: auth.session,
              sentryConfig: loggerConfig.sentry,
            });
            return <Component auth={auth} lowdefy={lowdefyRef.current} />;
          }}
        </Auth>
      </Suspense>
    </ErrorBoundary>
  );
}

const DynamicApp = dynamic(() => Promise.resolve(App), {
  ssr: false,
});

export default DynamicApp;
