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
import { useLocalSearchParams } from 'expo-router';
import { serializeQuery } from '@lowdefy/client-core';

import getTabHref from '../../src/navigation/getTabHref.js';
import PageScreen from '../../src/components/PageScreen.js';
import SwitchToTab from '../../src/components/SwitchToTab.js';
import { useSessionState } from '../../src/ShellContext.js';

// Every Lowdefy page, by path. The page and its path params come from the page index; the route's
// other params are the page's query. A tab's own page is shown on its tab, not stacked here.
export default function PathRoute() {
  const { path, ...query } = useLocalSearchParams();
  const { root } = useSessionState();
  const segments = Array.isArray(path) ? path : [path];
  const pagePath = segments.join('/');
  const tabHref = getTabHref({ path: pagePath, query: serializeQuery(query), root });
  if (tabHref !== null) {
    return <SwitchToTab href={tabHref} />;
  }
  return <PageScreen path={pagePath} query={serializeQuery(query)} />;
}
