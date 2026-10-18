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

import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, useWindowDimensions } from 'react-native';
import { getAppContext } from '@lowdefy/engine';
import { appStorageKey, pageInstanceKey, serializer, type } from '@lowdefy/helpers';
import { getBreakpoint } from '@lowdefy/layout-native';

import Block from './block/Block.js';
import BreakpointContext from './layout/BreakpointContext.js';
import Context from './Context.js';
import createScreenGlobals from './globals/createScreenGlobals.js';
import createFooterStore from './screen/createFooterStore.js';
import ElementsContext from './elements/ElementsContext.js';
import FocusMemoryContext from './screen/FocusMemoryContext.js';
import getFocusMemory from './screen/getFocusMemory.js';
import initNativeLowdefy from './initNativeLowdefy.js';
import PageStyleContext from './style/PageStyleContext.js';
import ScreenContext from './screen/ScreenContext.js';
import ScreenFooter from './screen/ScreenFooter.js';
import ScreenOptionsContext from './screen/ScreenOptionsContext.js';
import ThemeContext from './theme/ThemeContext.js';
import ThemeProvider from './theme/ThemeProvider.js';
import useElementRef from './elements/useElementRef.js';

// Pull-to-refresh on the page's scroll view, for a Screen with onRefresh: the native spinner shows
// until the refresh function's promise settles. Whether the scroll view has its refresh control is
// read from the page config, before the page renders, never from the Screen as it mounts: React
// Native's ScrollView draws the control ahead of its content, so the content moves, and mounts
// again, when the control comes or goes. A Screen that turned the control on as it mounted would
// mount again, turn it off as it unmounted, and so on, running onMount each time.
function useRefresh({ pageConfig }) {
  const refreshRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const setRefresh = useCallback((refresh) => {
    refreshRef.current = refresh;
  }, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.resolve(refreshRef.current?.()).finally(() => setRefreshing(false));
  }, []);
  const hasRefresh = !type.isNone(pageConfig.events?.onRefresh);
  return { hasRefresh, onRefresh, refreshing, setRefresh };
}

// The page scroll view's vertical offset as an Animated value on the native driver, which a
// Screen's headerBottom moves with. Each route instance has its own, from the top.
function useScrollY({ screenKey }) {
  const scrollY = useMemo(() => new Animated.Value(0), [screenKey]);
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY]
  );
  return { onScroll, scrollY };
}

const Page = ({
  bottomInset,
  core,
  focused,
  globals,
  headerInset,
  host,
  instanceId,
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
  const screenKey = instanceId === undefined ? instanceKey : `${instanceKey}@${instanceId}`;
  const contextKey =
    pageConfig.dynamic === true ? `${screenKey}:${buildRef.current.build}` : screenKey;

  const { hasRefresh, onRefresh, refreshing, setRefresh } = useRefresh({ pageConfig });
  const { onScroll, scrollY } = useScrollY({ screenKey });
  const [footer] = useState(createFooterStore);
  const screen = useMemo(
    () => ({ focused, footer, headerInset, scrollY, setRefresh }),
    [focused, footer, headerInset, scrollY, setRefresh]
  );

  const lowdefy = initNativeLowdefy({
    core,
    host,
    pageConfig,
    pathname: (globals ?? host.globals).window.location.pathname,
    pathParams,
    rootConfig,
    types,
  });
  lowdefy.theme._resolvedAntdToken = theme.tokens;
  const appContext = getAppContext({ events: rootConfig.events, jsMap, lowdefy });
  return (
    <BreakpointContext.Provider value={breakpoint}>
      <PageStyleContext.Provider value={pageStyle}>
        <ScreenOptionsContext.Provider value={onScreenOptions}>
          <ScreenContext.Provider value={screen}>
            {/* A native stack header is translucent on iOS 26 and later and the page scrolls
                under it: automatic insets start the content below the header and the tab bar,
                and let a large title collapse as the page scrolls. The page is drawn on the
                grouped background, as an iOS screen of grouped sections is. Its offset drives a
                Screen's headerBottom on the native driver. It is keyed by the route instance, so
                a position is kept only for the instance it was scrolled on: another instance
                starts at the top. Dragging it dismisses the keyboard, and a tap on a row works
                while the keyboard is up. */}
            <Animated.ScrollView
              key={screenKey}
              contentInsetAdjustmentBehavior="automatic"
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onScroll={onScroll}
              ref={scrollRef}
              scrollEventThrottle={16}
              style={{ backgroundColor: theme.tokens.colorGroupedBackground }}
              refreshControl={
                hasRefresh ? (
                  <RefreshControl
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    testID="screen-refresh"
                  />
                ) : undefined
              }
            >
              <Context
                key={contextKey}
                appContext={appContext}
                config={pageConfig}
                globals={globals}
                instanceId={instanceId}
                jsMap={jsMap}
                lowdefy={lowdefy}
                pathParams={pathParams}
                resetContext={resetContext}
              >
                {(context) => {
                  if (!context._internal.onInitDone) return null;
                  return (
                    <FocusMemoryContext.Provider value={getFocusMemory(context)}>
                      <Block
                        block={context._internal.RootSlots.map[pageConfig.blockId]}
                        Blocks={context._internal.RootSlots}
                        context={context}
                        lowdefy={lowdefy}
                        parentLoading={false}
                      />
                    </FocusMemoryContext.Provider>
                  );
                }}
              </Context>
            </Animated.ScrollView>
            <ScreenFooter bottomInset={bottomInset} footer={footer} />
          </ScreenContext.Provider>
        </ScreenOptionsContext.Provider>
      </PageStyleContext.Provider>
    </BreakpointContext.Provider>
  );
};

/**
 * Renders one Lowdefy page as native views, in a ScrollView, with a Screen's footer slot below it.
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
 * @param {(options: Object) => void} [props.onScreenOptions] Called by a Screen page with its
 *   header options for the router to draw the header (see screen/Screen.js).
 * @param {string} [props.instanceId] The route instance the page is shown on (a router's route
 *   key). Two screens of one page in a stack (task A, then task B pushed on it) each keep their
 *   own page state under it. Without it, every screen of a page shares one context.
 * @param {string} [props.routePath] The route the screen shows: path and query string. The page
 *   reads its location (`_url_query`, `_location`) from it, not from the host's shown route, so
 *   a screen under another keeps its own query.
 * @param {boolean} [props.focused] Whether the screen is the one shown; a Screen page fires
 *   onFocus each time it becomes true. Defaults to true.
 * @param {Object|number} [props.headerInset] Where the navigation bar's bottom edge is in the
 *   page scroll view's frame, which a Screen's headerBottom pins under: the header height (an
 *   Animated value that follows a collapsing large title) when the page scrolls under a
 *   translucent bar, or 0 when the page sits below the bar. Defaults to 0.
 * @param {Object} [props.resetContext] `{ reset, setReset }`: rebuild the page context once.
 * @param {number} [props.bottomInset] The screen's bottom safe area: the tab bar and the home
 *   indicator, which a Screen's footer is drawn above. Defaults to 0.
 *
 * A shell wraps its pages in one ThemeProvider, so they share the theme mode; a page outside one
 * makes its own.
 */
const LowdefyPage = ({
  bottomInset = 0,
  core,
  focused = true,
  headerInset = 0,
  host,
  instanceId,
  jsMap,
  onScreenOptions = null,
  pageConfig: rawPageConfig,
  pathParams = {},
  resetContext = { reset: false, setReset: () => undefined },
  rootConfig: rawRootConfig,
  routePath,
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
  const routePathRef = useRef(routePath);
  routePathRef.current = routePath;
  const hasRoutePath = routePath !== undefined;
  const globals = useMemo(
    () =>
      hasRoutePath
        ? createScreenGlobals({ globals: host.globals, getPath: () => routePathRef.current })
        : undefined,
    [hasRoutePath, host.globals]
  );
  const page = (
    <ElementsContext.Provider value={elements}>
      <Page
        bottomInset={bottomInset}
        core={core}
        focused={focused}
        globals={globals}
        headerInset={headerInset}
        host={host}
        instanceId={instanceId}
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
