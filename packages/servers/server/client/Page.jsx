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

import React, { useEffect, useReducer, useRef, useState } from 'react';

import Client from '@lowdefy/client';
import createRouter from '@lowdefy/client/adapters/createRouter.js';
import createLinkComponent from '@lowdefy/client/adapters/Link.js';
import { createUrl } from '@lowdefy/client/adapters/url.js';
import Head from '@lowdefy/client/adapters/Head.js';
import { buildPagePath } from '@lowdefy/helpers';

import blockMetas from '../build/plugins/blockMetas.json';
import jsMap from '../build/plugins/operators/clientJsMap.js';
import appMeta from '../build/appMeta.json';

import loadAllIcons from './loadAllIcons.js';
import loadPageTypes from './loadPageTypes.js';
import shouldReloadForBuild from './shouldReloadForBuild.js';
import types from './types.js';

// The path to fetch for a navigation. The app root shows the home page, and
// /api/page/ with an empty path matches no page, so it fetches the home page's
// own path.
function getFetchPath({ path, rootConfig }) {
  if (path !== '') {
    return path;
  }
  const { home, pagePaths } = rootConfig;
  return buildPagePath({
    pageId: home.pageId,
    path: pagePaths[home.pageId],
    pathParams: home.pathParams,
  });
}

// Replaces lib/client/Page.js. The first page renders from the config
// embedded in the HTML; SPA navigations fetch /api/page/<path> and swap the
// page. The server matches the path and answers with the page it shows, the
// values it carries and the path it matched.
function Page({ auth, config, lowdefy }) {
  const [page, setPage] = useState({
    matchedPath: config.matchedPath,
    pageConfig: config.pageConfig,
    pathParams: config.pathParams,
  });
  // The navigation listener is subscribed once, so it reads the shown page
  // through a ref rather than the state its closure captured.
  const pageRef = useRef(page);
  // A re-render with the same config is how the page context picks up a new
  // URL (getContext updates a memoized context on every render).
  const [, rerender] = useReducer((count) => count + 1, 0);

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
    const unsubscribe = router.subscribe(async ({ path, search }) => {
      const token = ++latestNavRef.current;
      // The path the shown instance was matched on shows the same page and
      // values whatever the query, so it needs no fetch. Another spelling of
      // the same values fetches and lands on the same instance. Dynamic pages
      // re-resolve per navigation.
      if (path === pageRef.current.matchedPath && pageRef.current.pageConfig.dynamic !== true) {
        rerender();
        return;
      }
      const fetchPath = getFetchPath({ path, rootConfig: config.rootConfig });
      try {
        // Forward the current query string so server-side Dynamic block
        // resolution sees the same urlQuery as an initial HTML load.
        const res = await fetch(`${router.basePath}/api/page/${fetchPath}${search}`);
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
          if (path !== '404') {
            router.replace({ pathname: '/404' });
          }
          return;
        }
        const { buildId, matchedPath, pageConfig, pathParams } = await res.json();
        if (token !== latestNavRef.current) return;
        if (
          shouldReloadForBuild({ bundleBuildId: appMeta.buildId, serverBuildId: buildId, window })
        ) {
          // The app was redeployed after this bundle loaded, so the config may
          // reference _js functions and plugins this bundle does not carry.
          // The router has already pushed the target URL, so a reload lands
          // on the requested page with the current bundle.
          window.location.reload();
          return;
        }
        // A failed chunk load falls to the catch below: a full page load.
        await loadPageTypes({ pageConfig });
        if (token !== latestNavRef.current) return;
        const nextPage = { matchedPath, pageConfig, pathParams };
        pageRef.current = nextPage;
        setPage(nextPage);
      } catch (error) {
        // Network failure on SPA navigation — fall back to a full page load.
        if (token !== latestNavRef.current) return;
        window.location.assign(createUrl({ basePath: router.basePath, pathname: `/${path}` }));
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Client
      auth={auth}
      Components={{ Head, Link }}
      config={{
        pageConfig: page.pageConfig,
        rootConfig: config.rootConfig,
      }}
      jsMap={jsMap}
      loadAllIcons={loadAllIcons}
      lowdefy={lowdefy}
      matchedPath={page.matchedPath}
      pathParams={page.pathParams}
      router={router}
      types={{
        ...types,
        blockMetas,
      }}
      window={window}
    />
  );
}

export default Page;
