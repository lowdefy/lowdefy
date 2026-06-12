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

import blockMetas from '../build/plugins/blockMetas.json';
import jsMap from '../build/plugins/operators/clientJsMap.js';
import pageRegistry from '../build/pageRegistry.mjs';

// Replaces lib/client/Page.js. The first page renders from the config
// embedded in the HTML. Types load per page (D14): public pages code-split
// into immutable chunks — config data plus exactly the block, action,
// operator, and icon imports that page uses — merged into shared registries
// the engine reads at render time. Protected and unknown pages fall back to
// the authorized /api/page fetch with a lazily-imported full type set.
let allTypesPromise;
function loadAllTypes() {
  allTypesPromise ??= import('../build/plugins/allTypes.mjs');
  return allTypesPromise;
}

function mergeTypes(target, partial) {
  for (const typeClass of ['actions', 'blocks', 'icons', 'operators']) {
    Object.assign(target[typeClass], partial?.[typeClass] ?? {});
  }
}

function Page({ auth, config, lowdefy }) {
  // internal: registry-loaded module pages arrive in the engine's internal
  // form (closures embedded) and skip the client's wire deserialization.
  const [page, setPage] = useState({ pageConfig: config.pageConfig, internal: false });
  const [typesReady, setTypesReady] = useState(false);

  // Stable registries — the client stores references at init and resolves
  // block components, actions, operators, and icons from them at render
  // time, so in-place merges are visible without re-initialization.
  const typesRef = useRef(null);
  if (!typesRef.current) {
    typesRef.current = { actions: {}, blockMetas, blocks: {}, icons: {}, operators: {} };
  }

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
    let mounted = true;
    (async () => {
      try {
        const loadPage = pageRegistry?.[config.pageConfig.pageId];
        if (loadPage) {
          const pageModule = await loadPage();
          mergeTypes(typesRef.current, pageModule.types);
          // Swap the embedded wire config for the module's internal form so
          // the first page evaluates through closures too.
          setPage({ pageConfig: pageModule.default(), internal: true });
        } else {
          mergeTypes(typesRef.current, (await loadAllTypes()).default);
        }
      } catch (error) {
        // Chunk failure on first paint — the full set is the safe ground.
        mergeTypes(typesRef.current, (await loadAllTypes()).default);
      }
      if (mounted) {
        setTypesReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = router.subscribe(async ({ pageId }) => {
      const targetPageId = pageId ?? config.rootConfig.home.pageId;
      try {
        const loadPage = pageRegistry?.[targetPageId];
        if (loadPage) {
          const pageModule = await loadPage();
          mergeTypes(typesRef.current, pageModule.types);
          setPage({ pageConfig: pageModule.default(), internal: true });
          return;
        }
        mergeTypes(typesRef.current, (await loadAllTypes()).default);
        const res = await fetch(`${router.basePath}/api/page/${targetPageId}`);
        if (!res.ok) {
          if (targetPageId !== '404') {
            router.replace({ pathname: '/404' });
          }
          return;
        }
        const { pageConfig: nextPageConfig } = await res.json();
        setPage({ pageConfig: nextPageConfig, internal: false });
      } catch (error) {
        // Network failure on SPA navigation — fall back to a full page load.
        window.location.assign(
          `${router.basePath}/${targetPageId === config.rootConfig.home.pageId ? '' : targetPageId}`
        );
      }
    });
    return unsubscribe;
  }, []);

  if (!typesReady) {
    return null;
  }

  return (
    <Client
      auth={auth}
      Components={{ Head, Link }}
      config={{
        pageConfig: page.pageConfig,
        pageConfigInternal: page.internal,
        rootConfig: config.rootConfig,
      }}
      jsMap={jsMap}
      lowdefy={lowdefy}
      router={router}
      types={typesRef.current}
      window={window}
    />
  );
}

export default Page;
