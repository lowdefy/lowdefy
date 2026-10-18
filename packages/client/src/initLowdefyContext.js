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

import React from 'react';
import { registerHtmlEnhancements } from '@lowdefy/block-utils';
import { createLowdefyCore, getActiveLocale, updateLowdefyPage } from '@lowdefy/client-core';
import { resolveTarget } from '@lowdefy/engine';

import createIcon from './createIcon.js';
import createShortcutBadge from './createShortcutBadge.js';
import createLinkComponent from './createLinkComponent.js';
import createWebHost from './host/createWebHost.js';
import setupLink from './setupLink.js';
import { createUrl } from './adapters/url.js';

// loadAllIcons (production server only) loads every icon the app bundles into
// types.icons; a page loads only its own icons, so a name that arrives at
// runtime may need it. Dev and e2e bundle every icon.
//
// matchedPath and pathParams are the server's match of the shown page: the
// path it was matched on (no basePath, no leading "/") and the values it
// carries.
//
// apiBase prefixes API calls; it defaults to the router's basePath.
function initLowdefyContext({
  apiBase,
  auth,
  Components,
  config,
  loadAllIcons,
  lowdefy,
  matchedPath,
  pathParams,
  router,
  stage,
  types,
  window,
}) {
  if (!lowdefy._internal?.initialised) {
    createLowdefyCore({
      apiBase,
      auth,
      basePath: router.basePath,
      host: createWebHost({ router, window }),
      lowdefy,
      rootConfig: config.rootConfig,
      types,
    });
    lowdefy._internal.components.Icon = createIcon({ icons: types.icons, loadAllIcons });
    lowdefy._internal.components.ShortcutBadge = createShortcutBadge(lowdefy);
    lowdefy._internal.components.Link = createLinkComponent(lowdefy, Components.Link);
    lowdefy._internal.components.handleError = lowdefy._internal.handleError;
    lowdefy._internal.link = setupLink(lowdefy);
    // HtmlComponent (block-utils) gives data-* attributes meaning in every
    // sanitised HTML string. The overlay pulls in antd Tooltip and Popover, so
    // it loads the first time HTML needs one. Links build hrefs with createUrl,
    // the one place basePath is applied, and navigate like the Link action. A
    // page link's pathname comes from resolveTarget, as the Link action's does.
    registerHtmlEnhancements({
      createHref: ({ pathname, query }) =>
        createUrl({ basePath: lowdefy.basePath, pathname, query }),
      createPageHref: ({ pageId, pathParams, urlQuery }) => {
        const target = resolveTarget({ lowdefy, target: { pageId, pathParams, urlQuery } });
        return createUrl({
          basePath: lowdefy.basePath,
          pathname: target.pathname,
          query: target.query,
        });
      },
      // The active locale useLocale publishes on the window.
      getLocale: () => getActiveLocale(window.__lowdefy_locale),
      // The overlay is lazy, so the app's Icon is bound in when it loads.
      HtmlOverlay: React.lazy(async () => {
        const { default: HtmlOverlay } = await import('./HtmlOverlay.js');
        const Icon = lowdefy._internal.components.Icon;
        function HtmlOverlayWithIcon(props) {
          return <HtmlOverlay {...props} Icon={Icon} />;
        }
        return { default: HtmlOverlayWithIcon };
      }),
      Icon: lowdefy._internal.components.Icon,
      icons: types.icons,
      link: lowdefy._internal.link,
      loadAllIcons,
      translate: lowdefy._internal.translate,
    });

    if (stage === 'dev' || stage === 'e2e') {
      window.lowdefy = lowdefy;
    }
  }

  updateLowdefyPage({ config, lowdefy, matchedPath, pathParams, user: auth?.user });
  return lowdefy;
}

export default initLowdefyContext;
