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
import createPageTypeLoader from '@lowdefy/client/createPageTypeLoader.js';
import createRouter from '@lowdefy/client/adapters/createRouter.js';
import createLinkComponent from '@lowdefy/client/adapters/Link.js';
import { createUrl } from '@lowdefy/client/adapters/url.js';
import Head from '@lowdefy/client/adapters/Head.js';
import { serializer } from '@lowdefy/helpers';

import blockMetas from '../build/plugins/blockMetas.json';
import iconNames from '../build/plugins/iconNames.js';
import pageTypeModules from '../build/plugins/pages/index.js';
import jsMap from '../build/plugins/operators/clientJsMap.js';
import rawLowdefyConfig from '../build/config.json';
import FeedbackWidget from './feedback/FeedbackWidget.jsx';

// Deserialize to restore arrays (feedback.roles) from ~arr markers.
const lowdefyConfig = serializer.deserialize(rawLowdefyConfig);

// Block components, client actions, client operators and icons arrive per
// page, so the app-wide barrels stay out of the main chunk. The registries are
// mutated in place as each page's module loads — the renderer resolves every
// type by name at render time. iconNames is the barrel's index, not its
// components: the loader needs it to know which names the barrel could still
// supply.
const types = { actions: {}, blockMetas, blocks: {}, icons: {}, operators: {} };

const loadPageTypes = createPageTypeLoader({
  iconNames,
  loadFullIcons: () => import('../build/plugins/icons.js').then((icons) => icons.default),
  loadFullTypes: () =>
    Promise.all([
      import('../build/plugins/actions.js'),
      import('../build/plugins/blocks.js'),
      import('../build/plugins/operators/client.js'),
    ]).then(([actions, blocks, operators]) => ({
      actions: actions.default,
      blocks: blocks.default,
      operators: operators.default,
    })),
  pageTypeModules,
  types,
});

// Replaces lib/client/Page.js. The first page renders from the config
// embedded in the HTML; SPA navigations fetch /api/page/* and swap pageConfig.
function Page({ auth, config, lowdefy }) {
  const [pageConfig, setPageConfig] = useState(config.pageConfig);
  // The first page renders only once its types have loaded — the shell paints
  // nothing before hydration either, so no loading state is skipped.
  const [typesReady, setTypesReady] = useState(false);

  useEffect(() => {
    loadPageTypes({
      pageConfig: config.pageConfig,
      pageId: config.pageConfig.pageId,
    }).then(() => setTypesReady(true));
  }, []);

  const routerRef = useRef(null);
  if (!routerRef.current) {
    const router = createRouter({ basePath: config.basePath ?? '', window });
    routerRef.current = {
      router,
      Link: createLinkComponent({ router }),
    };
  }
  const { router, Link } = routerRef.current;

  // Temporary sequence guard for the superseded-navigation race: a slow
  // response for an abandoned navigation must not paint over a newer one.
  // Remove when the loader-based lifecycle replaces these fetch paths.
  const latestNavRef = useRef(0);

  useEffect(() => {
    const unsubscribe = router.subscribe(async ({ pageId }) => {
      const token = ++latestNavRef.current;
      const targetPageId = pageId ?? config.rootConfig.home.pageId;
      try {
        // Forward the current query string so server-side Dynamic block
        // resolution sees the same urlQuery as an initial HTML load.
        const res = await fetch(
          `${router.basePath}/api/page/${targetPageId}${window.location.search}`
        );
        if (res.status === 401 || res.status === 403) {
          // 401: logged-out navigation to a protected page. 403: authorised but
          // second factor not yet enrolled. Both carry a { redirect } and full
          // load away so the destination can return here afterwards.
          const { redirect } = await res.json();
          if (token !== latestNavRef.current) return;
          window.location.assign(
            redirect ?? createUrl({ basePath: router.basePath, pathname: '/404' })
          );
          return;
        }
        if (!res.ok) {
          if (token !== latestNavRef.current) return;
          if (targetPageId !== '404') {
            router.replace({ pathname: '/404' });
          }
          return;
        }
        const { pageConfig: nextPageConfig } = await res.json();
        if (token !== latestNavRef.current) return;
        await loadPageTypes({ pageConfig: nextPageConfig, pageId: nextPageConfig.pageId });
        if (token !== latestNavRef.current) return;
        setPageConfig(nextPageConfig);
      } catch (error) {
        // Network failure on SPA navigation — fall back to a full page load.
        if (token !== latestNavRef.current) return;
        window.location.assign(
          createUrl({
            basePath: router.basePath,
            pathname: targetPageId === config.rootConfig.home.pageId ? '/' : `/${targetPageId}`,
          })
        );
      }
    });
    return unsubscribe;
  }, []);

  if (!typesReady) return null;

  return (
    <>
      <FeedbackWidget
        basePath={router.basePath}
        feedback={lowdefyConfig.feedback}
        pageId={pageConfig?.pageId}
        user={auth.user}
      />
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
        types={types}
        window={window}
      />
    </>
  );
}

export default Page;
