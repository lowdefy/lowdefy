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
import { translate } from '@lowdefy/helpers';

import createCallAPI from './createCallAPI.js';
import createAuthMethods from './auth/createAuthMethods.js';
import createCallRequest from './createCallRequest.js';
import createWebSocketClient from './websocket/createWebSocketClient.js';
import createIcon from './createIcon.js';
import createShortcutBadge from './createShortcutBadge.js';
import createLinkComponent from './createLinkComponent.js';
import createHandleError from './createHandleError.js';
import getActiveLocale from './getActiveLocale.js';
import { createBrowserLogger } from '@lowdefy/logger/browser';
import setupLink from './setupLink.js';
import { createUrl } from './adapters/url.js';

function initLowdefyContext({ auth, Components, config, lowdefy, router, stage, types, window }) {
  if (!lowdefy._internal?.initialised) {
    lowdefy._internal = {
      actions: types.actions,
      blockComponents: types.blocks,
      blockMetas: types.blockMetas ?? {},
      components: {
        Icon: createIcon(types.icons),
        ShortcutBadge: createShortcutBadge(lowdefy),
      },
      displayMessage: ({ content }) => {
        console.log(content);
        return () => undefined;
      },
      globals: {
        document: window.document,
        fetch: window.fetch,
        window,
      },
      initialised: true,
      link: () => undefined,
      operators: types.operators,
      progress: {
        state: {
          progress: 0,
        },
        dispatch: () => undefined,
      },
      router,
    };
    lowdefy.apiResponses = {};
    lowdefy.basePath = router.basePath;
    lowdefy.contexts = {};
    lowdefy.inputs = {};
    lowdefy.lowdefyApp = config.rootConfig.lowdefyApp;
    lowdefy.lowdefyGlobal = config.rootConfig.lowdefyGlobal;
    lowdefy.theme = config.rootConfig.theme ?? {};

    lowdefy._internal.callAPI = createCallAPI(lowdefy);
    lowdefy._internal.auth = createAuthMethods(lowdefy, auth);
    lowdefy._internal.callRequest = createCallRequest(lowdefy);
    lowdefy._internal.websocketClient = createWebSocketClient(lowdefy);
    lowdefy._internal.components.Link = createLinkComponent(lowdefy, Components.Link);
    lowdefy._internal.link = setupLink(lowdefy);
    lowdefy._internal.translate = (key, values) => translate({ key, values, i18n: lowdefy.i18n });
    lowdefy._internal.logger = createBrowserLogger();
    lowdefy._internal.handleError = createHandleError(lowdefy);
    lowdefy._internal.components.handleError = lowdefy._internal.handleError;
    // HtmlComponent (block-utils) gives data-* attributes meaning in every
    // sanitised HTML string. The overlay pulls in antd Tooltip and Popover, so
    // it loads the first time HTML needs one. Links build hrefs with createUrl,
    // the one place basePath is applied, and navigate like the Link action.
    registerHtmlEnhancements({
      createHref: ({ pathname, query }) =>
        createUrl({ basePath: lowdefy.basePath, pathname, query }),
      getLocale: () => getActiveLocale(window),
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
      translate: lowdefy._internal.translate,
    });

    if (stage === 'dev' || stage === 'e2e') {
      window.lowdefy = lowdefy;
    }
  }

  lowdefy.home = config.rootConfig.home || {};
  lowdefy.menus = config.rootConfig.menus;
  lowdefy.pageId = config.pageConfig.pageId;
  lowdefy.user = auth?.user ?? null;

  return lowdefy;
}

export default initLowdefyContext;
