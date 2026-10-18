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

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useFocusEffect, useNavigation } from 'expo-router';
import { LowdefyPage } from '@lowdefy/client-native';

import evaluateJsEntries from '../js/evaluateJsEntries.js';
import getPageView from '../session/getPageView.js';
import getPresentation from '../navigation/getPresentation.js';
import LoadingScreen from './LoadingScreen.js';
import MessageScreen from './MessageScreen.js';
import OtherPageScreen from './OtherPageScreen.js';
import types from '../plugins/types.js';
import UpdateScreen from './UpdateScreen.js';
import { useSessionState, useShell } from '../ShellContext.js';

/**
 * One screen of the frame: the Lowdefy page at `path`, from the cache, with its header drawn from
 * the Screen page's options.
 *
 * @param {Object} props
 * @param {string} props.path The page path, without the leading "/".
 * @param {string} [props.query] The route's query string, without "?".
 */
function PageScreen({ path, query = '' }) {
  const { auth, host, locale, session, shell } = useShell();
  const state = useSessionState();
  // A locale chosen with SetLocale renders every screen again, as the web app re-renders.
  useSyncExternalStore(locale.subscribe, locale.getVersion);
  const navigation = useNavigation();
  const [loadError, setLoadError] = useState(null);
  const view = getPageView({ path, shell, state });
  const fullPath = `/${path}${query ? `?${query}` : ''}`;
  const pageId = view.entry?.pageId ?? null;
  // The app events' and the page's _js, as the jsMap the engine's _js operator reads.
  const rootJsEntries = state.root._jsEntries;
  const pageJsEntries = view.page?.pageConfig._jsEntries;
  const jsMap = useMemo(
    () => ({ ...evaluateJsEntries(rootJsEntries), ...evaluateJsEntries(pageJsEntries) }),
    [rootJsEntries, pageJsEntries]
  );

  // The engine reads the shown route (_location, _url_query) through the host globals. Screens
  // rendered at once (one per tab) each set it as they render; the focused one keeps it.
  useFocusEffect(
    useCallback(() => {
      session.setCurrentPath(fullPath);
    }, [fullPath, session])
  );

  // Once per visit: fetch the page when it is not cached, or when it is built per request.
  useEffect(() => {
    if (pageId === null) return;
    const entry = session.getState().root.pageIndex.find((item) => item.pageId === pageId);
    setLoadError(null);
    session.loadPage({ entry, path }).catch((error) => setLoadError(error));
  }, [pageId, path, session, state.cacheKey]);

  const onScreenOptions = useCallback(
    ({ headerRight, presentation, title }) => {
      navigation.setOptions({
        headerRight,
        presentation: getPresentation(presentation),
        title: title ?? '',
      });
    },
    [navigation]
  );

  if (view.view === 'update') {
    return <UpdateScreen shell={shell} />;
  }
  if (view.view === 'other') {
    return <OtherPageScreen path={path} />;
  }
  if (view.view === 'loading') {
    if (loadError !== null) {
      return (
        <MessageScreen
          action={{
            title: 'Try again',
            onPress: () => {
              setLoadError(null);
              session.loadPage({ entry: view.entry, path }).catch((error) => setLoadError(error));
            },
          }}
          body={loadError.message}
          testID="shell-page-error"
          title="This page could not be loaded"
        />
      );
    }
    return <LoadingScreen />;
  }
  session.setCurrentPath(fullPath);
  locale.apply();
  // The page's icons join the icon map the Icon renderer reads, which every page of the app shares.
  Object.assign(types.icons, view.page.pageConfig._icons);
  // The core's auth actions call the shell's bearer client (createCoreAuth).
  const core = {
    apiBase: session.apiBase,
    auth: { ...auth.coreAuth, user: state.user },
    basePath: '',
    lowdefy: state.lowdefy,
  };
  return (
    <LowdefyPage
      // A new generation (another caller or build) or a new version of the page rebuilds it.
      key={`${state.generation}:${view.page.hash ?? view.page.etag ?? ''}`}
      core={core}
      host={host}
      jsMap={jsMap}
      onScreenOptions={onScreenOptions}
      pageConfig={view.page.pageConfig}
      pathParams={view.pathParams}
      rootConfig={state.rootConfig}
      types={types}
    />
  );
}

export default PageScreen;
