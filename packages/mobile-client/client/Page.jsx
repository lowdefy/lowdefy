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

import Client from '@lowdefy/client/Client.js';
import createRouter from '@lowdefy/client/adapters/createRouter.js';
import createLinkComponent from '@lowdefy/client/adapters/Link.js';
import Head from '@lowdefy/client/adapters/Head.js';

import actions from 'build/mobile/plugins/actions.js';
import blockMetas from 'build/mobile/plugins/blockMetas.json';
import blocks from 'build/mobile/plugins/blocks.js';
import icons from 'build/mobile/plugins/icons.js';
import operators from 'build/mobile/plugins/operators/client.js';
import jsMap from 'build/mobile/plugins/operators/clientJsMap.js';

import NotFound from './NotFound.jsx';

// Mobile mirror of the web Page.jsx — no embedded config: every page,
// including the first, is fetched from /api/page/*. Routing stays
// origin-local inside the webview while API calls go to apiBase.
function Page({ apiBase, auth, lowdefy, rootConfig }) {
  const [pageConfig, setPageConfig] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const routerRef = useRef(null);
  if (!routerRef.current) {
    const router = createRouter({ basePath: '', window });
    routerRef.current = {
      router,
      Link: createLinkComponent({ router }),
    };
  }
  const { router, Link } = routerRef.current;

  useEffect(() => {
    async function fetchPage({ pageId }) {
      const targetPageId = pageId ?? rootConfig.home.pageId;
      if (!targetPageId) {
        setNotFound(true);
        return;
      }
      try {
        const res = await fetch(`${apiBase}/api/page/${targetPageId}${window.location.search}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        // Prod wraps the config ({ pageConfig }), the dev JIT route returns it bare.
        const body = await res.json();
        const nextPageConfig = body.pageConfig ?? body;
        // Cross-target Links resolve at runtime — a web page in the mobile
        // app shows the 404 view instead of half-rendering with missing
        // block types (decision 5).
        if (nextPageConfig.target !== 'mobile') {
          setNotFound(true);
          return;
        }
        setNotFound(false);
        setPageConfig(nextPageConfig);
      } catch (error) {
        console.error(error);
        setNotFound(true);
      }
    }
    const unsubscribe = router.subscribe(fetchPage);
    fetchPage(router.getLocation());
    return unsubscribe;
  }, []);

  if (notFound) {
    return (
      <NotFound
        onHome={
          rootConfig.home.pageId ? () => router.push({ pathname: '/' }) : undefined
        }
      />
    );
  }

  if (!pageConfig) {
    return '';
  }

  return (
    <Client
      apiBase={apiBase}
      auth={auth}
      Components={{ Head, Link }}
      config={{
        pageConfig,
        rootConfig,
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
