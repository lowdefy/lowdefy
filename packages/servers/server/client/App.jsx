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

import React, { useRef } from 'react';

import { serializer } from '@lowdefy/helpers';

import appMeta from '../build/appMeta.json';
import rawLoggerConfig from '../build/logger.json';
import Auth from '../lib/client/auth/Auth.jsx';
import createLogUsage from '../lib/client/createLogUsage.js';
import initSentryClient from '../lib/client/sentry/initSentryClient.js';
import setSentryUser from '../lib/client/sentry/setSentryUser.js';
import AppShell from './AppShell.jsx';
import Page from './Page.jsx';

// Deserialize to restore arrays (e.g. sentry.userFields) from ~arr markers.
const loggerConfig = serializer.deserialize(rawLoggerConfig);

function App({ config }) {
  const { rootConfig, user } = config;

  // Sentry DSN arrives at runtime via the embedded config (the server reads
  // SENTRY_DSN per process) — no build-time env inlining.
  initSentryClient({
    sentryDsn: config.sentryDsn,
    sentryConfig: loggerConfig.sentry,
  });

  const usageDataRef = useRef({});
  const lowdefyRef = useRef({
    // Sent with every request and endpoint call so the server refuses calls
    // from a tab still running an earlier build (@lowdefy/client request.js).
    buildId: appMeta.buildId,
    eventCallback: createLogUsage({ basePath: config.basePath ?? '', usageDataRef }),
  });

  return (
    <AppShell basePath={config.basePath ?? ''} lowdefy={lowdefyRef.current} rootConfig={rootConfig}>
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
    </AppShell>
  );
}

export default App;
