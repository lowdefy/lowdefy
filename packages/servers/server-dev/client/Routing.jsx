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

import React, { Suspense, useEffect, useState } from 'react';

import Head from '@lowdefy/client/adapters/Head.js';
import createLinkComponent from '@lowdefy/client/adapters/Link.js';

import BuildingPage from '../lib/client/BuildingPage.jsx';
import Reload from './Reload.jsx';
import Page from './Page.jsx';
import setPageId from '../lib/client/setPageId.js';
import { bumpNavVersion, getReloadVersion } from '../lib/client/utils/useMutateCache.js';
import useRootConfig from '../lib/client/utils/useRootConfig.js';

import actions from '../build/plugins/actions.js';
import blockMetas from '../build/plugins/blockMetas.json';
import blocks from '../build/plugins/blocks.js';
import icons from '../build/plugins/icons.js';
import operators from '../build/plugins/operators/client.js';
import staticJsMap from '../build/plugins/operators/clientJsMap.js';

// Replaces lib/client/App.js — page resolution driven by the custom router
// instead of next/router, everything else preserved.
function Routing({ auth, lowdefy, router }) {
  const { data: rootConfig } = useRootConfig(router.basePath);
  const [location, setLocation] = useState(() => router.getLocation());

  useEffect(() => {
    return router.subscribe((location) => {
      // Dynamic pages re-resolve per navigation — bump before setLocation so
      // the page config SWR key changes with the navigation. The router
      // notifies with a fresh location object per event, so same-URL
      // navigations already produce a state change.
      bumpNavVersion();
      setLocation(location);
    });
  }, [router]);

  const [Link] = useState(() => createLinkComponent({ router }));

  if (rootConfig?.theme) {
    lowdefy.theme = rootConfig.theme;
  }

  const { redirect, pageId } = setPageId(location, rootConfig);
  useEffect(() => {
    if (redirect) {
      router.replace({ pathname: `/${pageId}` });
    }
  }, [redirect, pageId, router]);
  if (redirect) {
    return '';
  }

  return (
    <Reload basePath={router.basePath} lowdefy={lowdefy}>
      {(resetContext) => (
        <Suspense key={`${pageId}_${getReloadVersion()}`} fallback={<BuildingPage />}>
          <Page
            auth={auth}
            Components={{ Head, Link }}
            config={{
              rootConfig,
            }}
            jsMap={staticJsMap}
            lowdefy={lowdefy}
            pageId={pageId}
            resetContext={resetContext}
            router={router}
            types={{
              actions,
              blockMetas,
              blocks,
              icons,
              operators,
            }}
          />
        </Suspense>
      )}
    </Reload>
  );
}

export default Routing;
