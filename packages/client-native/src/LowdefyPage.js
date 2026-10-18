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

import React, { useContext, useMemo, useRef } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { getAppContext } from '@lowdefy/engine';
import { appStorageKey, pageInstanceKey, serializer } from '@lowdefy/helpers';
import { getBreakpoint } from '@lowdefy/layout-native';

import Block from './block/Block.js';
import BreakpointContext from './layout/BreakpointContext.js';
import Context from './Context.js';
import ElementsContext from './elements/ElementsContext.js';
import initNativeLowdefy from './initNativeLowdefy.js';
import PageStyleContext from './style/PageStyleContext.js';
import ScreenOptionsContext from './screen/ScreenOptionsContext.js';
import ThemeContext from './theme/ThemeContext.js';
import ThemeProvider from './theme/ThemeProvider.js';
import useElementRef from './elements/useElementRef.js';

const Page = ({
  core,
  host,
  jsMap,
  onScreenOptions,
  pageConfig,
  pathParams,
  resetContext,
  rootConfig,
  types,
}) => {
  // Read here, so a change of theme mode renders the page again: the engine's render-time full
  // pass (getContext) then evaluates _media: darkMode and _theme with the new mode.
  const theme = useContext(ThemeContext);
  const scrollRef = useElementRef({ kind: 'scroll' });
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint({ width, height });
  // In dev, a page built on request carries the class map entries of its own classes, which the
  // app's class map, built before the page, does not hold.
  const pageStyle = useMemo(
    () => ({
      classMap: { ...rootConfig.classMap, ...pageConfig._classMap },
      sharedPage: pageConfig.target === 'both',
    }),
    [rootConfig.classMap, pageConfig._classMap, pageConfig.target]
  );

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
  lowdefy.theme._resolvedAntdToken = theme.tokens;
  const appContext = getAppContext({ events: rootConfig.events, jsMap, lowdefy });
  return (
    <BreakpointContext.Provider value={breakpoint}>
      <PageStyleContext.Provider value={pageStyle}>
        <ScreenOptionsContext.Provider value={onScreenOptions}>
          {/* A native stack header is translucent on iOS 26 and later and the page scrolls under
              it: automatic insets start the content below the header and the tab bar. The page
              is drawn on the grouped background, as an iOS screen of grouped sections is. */}
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            style={{ backgroundColor: theme.tokens.colorGroupedBackground }}
          >
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
      </PageStyleContext.Provider>
    </BreakpointContext.Provider>
  );
};

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
 * @param {Object} props.pageConfig The page, as the server sends it (serialized). A page built
 *   on request in dev carries `_classMap`, the class map entries of its own classes.
 * @param {Object} props.rootConfig The app's root config, as the server sends it (serialized),
 *   with the mobile root's `theme` (`{ darkMode, light, dark }`) and `classMap`.
 * @param {Object} props.types `{ blocks, actions, operators, icons }`, the native plugin maps and
 *   the icon data `components.Icon` draws from. Each block component carries its `meta`. The
 *   first page's `icons` object is kept and read at render, so a shell adds a page's `_icons` to
 *   it before the page renders.
 * @param {Object} [props.pathParams] The values of the page path's params, from the router.
 * @param {Object} [props.jsMap] The page's compiled `_js` functions.
 * @param {(options: Object) => void} [props.onScreenOptions] Called by a Screen page with
 *   `{ title, presentation, headerRight }` for the router to draw the header.
 * @param {Object} [props.resetContext] `{ reset, setReset }`: rebuild the page context once.
 *
 * A shell wraps its pages in one ThemeProvider, so they share the theme mode; a page outside one
 * makes its own.
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
  const theme = useContext(ThemeContext);
  // The page's views register here, by block id, for native actions (globals.elements).
  const elements = useMemo(
    () => ({ registry: host.globals.elements, pageId: pageConfig.pageId }),
    [host.globals.elements, pageConfig.pageId]
  );
  const page = (
    <ElementsContext.Provider value={elements}>
      <Page
        core={core}
        host={host}
        jsMap={jsMap}
        onScreenOptions={onScreenOptions}
        pageConfig={pageConfig}
        pathParams={pathParams}
        resetContext={resetContext}
        rootConfig={rootConfig}
        types={types}
      />
    </ElementsContext.Provider>
  );
  if (theme !== null) {
    return page;
  }
  return (
    <ThemeProvider
      host={host}
      storageKey={appStorageKey({
        basePath: core.basePath ?? '',
        name: 'lowdefy_darkMode',
        slug: rootConfig.lowdefyApp?.slug,
      })}
      theme={rootConfig.theme}
    >
      {page}
    </ThemeProvider>
  );
};

export default LowdefyPage;
