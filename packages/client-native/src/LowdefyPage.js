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

import React, { useMemo, useRef } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { getAppContext } from '@lowdefy/engine';
import { pageInstanceKey, serializer } from '@lowdefy/helpers';

import Block from './block/Block.js';
import BreakpointContext from './layout/BreakpointContext.js';
import Context from './Context.js';
import getBreakpoint from './layout/getBreakpoint.js';
import initNativeLowdefy from './initNativeLowdefy.js';
import ScreenOptionsContext from './screen/ScreenOptionsContext.js';

/**
 * Renders one Lowdefy page as native views, in a ScrollView.
 *
 * @param {Object} props
 * @param {Object} props.core What the page needs to build the app's core the first time:
 *   `{ lowdefy, apiBase, basePath, auth }`. `lowdefy` is the app-level object every page of the
 *   app shares; `createLowdefyCore` fills it on the first page.
 * @param {Object} props.host The host for `@lowdefy/client-core` (fetch, router, storage,
 *   globals, WebSocket, websocketUrl, onBuildChanged, onCallerChanged). Its globals come from
 *   `createNativeGlobals`, so `location` is the shown route.
 * @param {Object} props.pageConfig The page, as the server sends it (serialized).
 * @param {Object} props.rootConfig The app's root config, as the server sends it (serialized).
 * @param {Object} props.types `{ blocks, actions, operators }`, the native plugin maps. Each
 *   block component carries its `meta`.
 * @param {Object} [props.pathParams] The values of the page path's params, from the router.
 * @param {Object} [props.jsMap] The page's compiled `_js` functions.
 * @param {(options: Object) => void} [props.onScreenOptions] Called by a Screen page with
 *   `{ title, presentation, headerRight }` for the router to draw the header.
 * @param {Object} [props.resetContext] `{ reset, setReset }`: rebuild the page context once.
 */
const LowdefyPage = ({
  core,
  host,
  jsMap,
  onScreenOptions = null,
  pageConfig: rawPageConfig,
  pathParams = {},
  resetContext = { reset: false, setReset: () => undefined },
  rootConfig: rawRootConfig,
  types,
}) => {
  // Deserialized once per fetched config: the engine keeps dynamic page contexts by config
  // object identity.
  const pageConfig = useMemo(() => serializer.deserialize(rawPageConfig), [rawPageConfig]);
  const rootConfig = useMemo(() => serializer.deserialize(rawRootConfig), [rawRootConfig]);
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint({ width, height });

  // A new page instance (another set of path values) remounts the page tree; a dynamic page
  // remounts on every fetch, since its context is rebuilt per fetch.
  const instanceKey = pageInstanceKey({
    pageId: pageConfig.pageId,
    path: pageConfig.path,
    pathParams,
  });
  const buildRef = useRef({ config: null, build: 0 });
  if (buildRef.current.config !== pageConfig) {
    buildRef.current = { config: pageConfig, build: buildRef.current.build + 1 };
  }
  const contextKey =
    pageConfig.dynamic === true ? `${instanceKey}:${buildRef.current.build}` : instanceKey;

  const lowdefy = initNativeLowdefy({ core, host, pageConfig, pathParams, rootConfig, types });
  const appContext = getAppContext({ events: rootConfig.events, jsMap, lowdefy });
  return (
    <BreakpointContext.Provider value={breakpoint}>
      <ScreenOptionsContext.Provider value={onScreenOptions}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Context
            key={contextKey}
            appContext={appContext}
            config={pageConfig}
            jsMap={jsMap}
            lowdefy={lowdefy}
            pathParams={pathParams}
            resetContext={resetContext}
          >
            {(context) => {
              if (!context._internal.onInitDone) return null;
              return (
                <Block
                  block={context._internal.RootSlots.map[pageConfig.blockId]}
                  Blocks={context._internal.RootSlots}
                  context={context}
                  lowdefy={lowdefy}
                  parentLoading={false}
                />
              );
            }}
          </Context>
        </ScrollView>
      </ScreenOptionsContext.Provider>
    </BreakpointContext.Provider>
  );
};

export default LowdefyPage;
