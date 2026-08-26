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
import { GenIcon } from 'react-icons/lib';

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

// Dev-only: JIT page builds can add client _js entries and icons after the
// skeleton build — fetch the module text the dev server serves and evaluate
// it, mirroring the web dev client.
async function fetchDevModule(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return {};
    const text = await res.text();
    const fn = new Function('exports', text.replace('export default', 'exports.default ='));
    const mod = {};
    fn(mod);
    return mod.default ?? {};
  } catch {
    return {};
  }
}

// Mobile mirror of the web Page.jsx — no embedded config: every page,
// including the first, is fetched from /api/page/*. Routing stays
// origin-local inside the webview while API calls go to apiBase.
function Page({ apiBase, auth, lowdefy, rootConfig }) {
  const [pageConfig, setPageConfig] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [buildError, setBuildError] = useState(null);
  const [jsEntries, setJsEntries] = useState(null);

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
        const body = await res.json().catch(() => null);
        // Dev JIT states — surface the build error and retry while plugins install.
        if (body?.buildError) {
          setBuildError(body);
          return;
        }
        if (body?.installing) {
          setTimeout(() => fetchPage({ pageId }), 2500);
          return;
        }
        if (!res.ok || !body) {
          setNotFound(true);
          return;
        }
        // Prod wraps the config ({ pageConfig }), the dev JIT route returns it bare.
        const nextPageConfig = body.pageConfig ?? body;
        // Cross-target Links resolve at runtime — a web page in the mobile
        // app shows the 404 view instead of half-rendering with missing
        // block types (decision 5).
        if (nextPageConfig.target !== 'mobile') {
          setNotFound(true);
          return;
        }
        // JIT-discovered client _js functions and icons are exposed through
        // dev-only routes; merge them like the web dev client does. The
        // whole branch is compiled out of production bundles.
        if (import.meta.env.DEV) {
          const [entries, dynamicIcons] = await Promise.all([
            fetchDevModule(`${apiBase}/api/js/client`),
            fetchDevModule(`${apiBase}/api/icons/dynamic`),
          ]);
          // createIcon looks up icons[name] on every render from the captured
          // reference, so mutating the imported object publishes new icons.
          Object.entries(dynamicIcons).forEach(([name, data]) => {
            if (!icons[name]) {
              icons[name] = GenIcon(data);
            }
          });
          setJsEntries(entries);
        }
        setBuildError(null);
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

  if (buildError) {
    return (
      <div style={{ padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        <h3>Build error</h3>
        <p>{buildError.message}</p>
        {(buildError.errors ?? []).map((error, index) => (
          <p key={index}>{error.message ?? String(error)}</p>
        ))}
      </div>
    );
  }

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
      jsMap={jsEntries ? { ...jsMap, ...jsEntries } : jsMap}
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
