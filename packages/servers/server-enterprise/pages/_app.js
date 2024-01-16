/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';

import { ErrorBoundary } from '@lowdefy/block-utils';

import Auth from '../lib/client/auth/Auth.js';
import createLogUsage from '../lib/client/createLogUsage.js';

// Must be in _app due to next specifications.
import '../build/plugins/styles.less';

function App({ Component, pageProps: { session, rootConfig, pageConfig } }) {
  const usageDataRef = useRef({});
  const lowdefyRef = useRef({ eventCallback: createLogUsage({ usageDataRef }) });
  return (
    <ErrorBoundary fullPage>
      <Auth session={session}>
        {(auth) => {
          usageDataRef.current.user = auth.session?.hashed_id;
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
  );
}

const DynamicApp = dynamic(() => Promise.resolve(App), {
  ssr: false,
});

export default DynamicApp;
