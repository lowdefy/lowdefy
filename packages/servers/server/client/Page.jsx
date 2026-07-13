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

import React, { useEffect, useRef, useState } from 'react';

import Client from '@lowdefy/client';
import createRouter from '@lowdefy/client/adapters/createRouter.js';
import createLinkComponent from '@lowdefy/client/adapters/Link.js';
import Head from '@lowdefy/client/adapters/Head.js';

import actions from '../build/plugins/actions.js';
import blockMetas from '../build/plugins/blockMetas.json';
import blocks from '../build/plugins/blocks.js';
import icons from '../build/plugins/icons.js';
import operators from '../build/plugins/operators/client.js';
import jsMap from '../build/plugins/operators/clientJsMap.js';

// Replaces lib/client/Page.js. The first page renders from the config
// embedded in the HTML; SPA navigations fetch /api/page/* and swap pageConfig.
function Page({ auth, config, lowdefy }) {
  const [pageConfig, setPageConfig] = useState(config.pageConfig);

  const routerRef = useRef(null);
  if (!routerRef.current) {
    const router = createRouter({ basePath: config.basePath ?? '', window });
    routerRef.current = {
      router,
      Link: createLinkComponent({ router }),
    };
  }
  const { router, Link } = routerRef.current;

  useEffect(() => {
    const unsubscribe = router.subscribe(async ({ pageId }) => {
      const targetPageId = pageId ?? config.rootConfig.home.pageId;
      try {
        // Forward the current query string so server-side Dynamic block
        // resolution sees the same urlQuery as an initial HTML load.
        const res = await fetch(
          `${router.basePath}/api/page/${targetPageId}${window.location.search}`
        );
        if (res.status === 401) {
          // Logged-out navigation to a protected page - full load to the
          // login page so it can return here after sign-in.
          const { redirect } = await res.json();
          window.location.assign(redirect ?? `${router.basePath}/404`);
          return;
        }
        if (!res.ok) {
          if (targetPageId !== '404') {
            router.replace({ pathname: '/404' });
          }
          return;
        }
        const { pageConfig: nextPageConfig } = await res.json();
        setPageConfig(nextPageConfig);
      } catch (error) {
        // Network failure on SPA navigation — fall back to a full page load.
        window.location.assign(
          `${router.basePath}/${targetPageId === config.rootConfig.home.pageId ? '' : targetPageId}`
        );
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Client
      auth={auth}
      Components={{ Head, Link }}
      config={{
        pageConfig,
        rootConfig: config.rootConfig,
      }}
      jsMap={jsMap}
      lowdefy={lowdefy}
      router={router}
      types={{
        actions,
        blockMetas,
        blocks,
        icons,
        operators,
      }}
      window={window}
    />
  );
}

export default Page;
