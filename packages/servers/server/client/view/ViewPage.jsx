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
import createLinkComponent from '@lowdefy/client/adapters/Link.js';
import Head from '@lowdefy/client/adapters/Head.js';
import shouldViewCallerChange from '@lowdefy/client/host/shouldViewCallerChange.js';
import recordCallerStamp from '@lowdefy/client/recordCallerStamp.js';
import showPopupBlocked from '@lowdefy/client/showPopupBlocked.js';
import { parseCallerStamp } from '@lowdefy/helpers';

import blockMetas from '../../build/plugins/blockMetas.json';
import jsMap from '../../build/plugins/operators/clientJsMap.js';
import appMeta from '../../build/appMeta.json';

import getFetchPath from '../getFetchPath.js';
import getShownPage from '../getShownPage.js';
import loadAllIcons from '../loadAllIcons.js';
import loadPageTypes from '../loadPageTypes.js';
import types from '../types.js';
import fetchViewPage from './fetchViewPage.js';
import getBrowserUrl from './getBrowserUrl.js';

// The page of an MCP App view: Page.jsx for a client that runs in a host's
// frame. The router keeps its location in the host, the page config comes from
// the app's absolute origin with the view's bearer session, and nothing here
// reads or reloads the frame's own location. A build or caller change is told
// to the view host, which the view's app listens to.
//
// A link to a view page navigates in place. Every other link is opened in the
// browser by the host: a page the app does not serve to a view, once the app
// has said so, and anything the frame would open or follow itself, which the
// view host catches for as long as the page is mounted.
function ViewPage({ auth, firstPage, host, lowdefy, rootConfig }) {
  const { router } = host;
  const [page, setPage] = useState(firstPage);
  // The navigation listener is subscribed once, so it reads the shown page
  // through a ref rather than the state its closure captured.
  const pageRef = useRef(page);
  // The history as it was when the shown page was reached, to return to when
  // a navigation shows none.
  const shownHistoryRef = useRef(router.snapshot());
  const stayingRef = useRef(false);
  // A re-render with the same config is how the page context picks up a new
  // URL (getContext updates a memoized context on every render).
  const [, rerender] = useReducer((count) => count + 1, 0);

  const linkRef = useRef(null);
  if (!linkRef.current) {
    linkRef.current = createLinkComponent({ origin: host.view.bridge.appOrigin, router });
  }
  const Link = linkRef.current;

  // A slow response for an abandoned navigation must not paint over a newer one.
  const latestNavRef = useRef(0);

  useEffect(() => {
    const stops = [
      host.view.captureLinks(),
      host.view.onLinkRefused(() => showPopupBlocked({ lowdefy })),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  useEffect(() => {
    // The view shows only its app's view pages, so a navigation that shows no
    // page is undone: the view stays on the page it shows.
    function stayOnShownPage() {
      stayingRef.current = true;
      router.restore(shownHistoryRef.current);
      stayingRef.current = false;
    }

    const unsubscribe = router.subscribe(async (location) => {
      const { path, search } = location;
      const token = ++latestNavRef.current;
      // Back on the shown page after a navigation that showed none: the page
      // is there already, so a dynamic page is not resolved again.
      if (stayingRef.current) {
        rerender();
        return;
      }
      // The path the shown instance was matched on shows the same page and
      // values whatever the query, so it needs no fetch. Dynamic pages
      // re-resolve per navigation.
      if (path === pageRef.current.matchedPath && pageRef.current.pageConfig.dynamic !== true) {
        shownHistoryRef.current = router.snapshot();
        rerender();
        return;
      }
      try {
        const fetched = await fetchViewPage({
          fetchPath: getFetchPath({ path, rootConfig }),
          host,
          search,
        });
        if (token !== latestNavRef.current || host.view.isEnded()) return;
        if (!fetched.shown) {
          stayOnShownPage();
          // A page of the app that is not a view page opens in the browser.
          const url = getBrowserUrl({ fetched, location, origin: host.view.bridge.appOrigin });
          if (url !== null) {
            host.view.openLink({ url });
          }
          return;
        }
        const { response, serverCaller } = fetched;
        if (response.buildId !== appMeta.buildId) {
          // The app was redeployed after this bundle loaded, so the config may
          // reference _js functions and plugins this bundle does not carry.
          host.onBuildChanged({ serverBuildId: response.buildId });
          stayOnShownPage();
          return;
        }
        // The app answered as another caller than this view renders, or with
        // other roles: the view host loads the view again for that caller, at
        // the location the router now holds.
        if (shouldViewCallerChange({ host, serverCaller, user: lowdefy.user })) {
          host.onCallerChanged(parseCallerStamp(serverCaller));
          return;
        }
        recordCallerStamp({ lowdefy, serverCaller });
        await loadPageTypes({ pageConfig: response.pageConfig });
        if (token !== latestNavRef.current) return;
        const nextPage = getShownPage({ path, response });
        pageRef.current = nextPage;
        shownHistoryRef.current = router.snapshot();
        setPage(nextPage);
      } catch (error) {
        // The app could not be reached, or the page's plugin code did not
        // load. A browser tab falls back to a full page load; a view has none.
        if (token !== latestNavRef.current) return;
        // eslint-disable-next-line no-console
        console.error(error);
        stayOnShownPage();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Client
      apiBase={host.apiBase}
      auth={auth}
      Components={{ Head, Link }}
      config={{
        pageConfig: page.pageConfig,
        rootConfig,
      }}
      host={host}
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

export default ViewPage;
