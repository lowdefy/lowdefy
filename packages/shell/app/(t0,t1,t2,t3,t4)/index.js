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

import React, { useContext } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { serializeQuery } from '@lowdefy/client-core';

import getSlotRootPath from '../../src/navigation/getSlotRootPath.js';
import MessageScreen from '../../src/components/MessageScreen.js';
import PageScreen from '../../src/components/PageScreen.js';
import SlotContext from '../../src/navigation/SlotContext.js';
import { useSessionState } from '../../src/ShellContext.js';

// The first screen of a frame group: its tab's page, or the app's home page. A link to a tab's
// page switches to the tab (toRouterHref) with its query as the route's params.
export default function GroupIndex() {
  const slotIndex = useContext(SlotContext);
  const query = useLocalSearchParams();
  const { root } = useSessionState();
  const path = getSlotRootPath({ root, slotIndex });
  if (path === null) {
    return <MessageScreen testID="shell-no-home" title="This app has no page to open" />;
  }
  return <PageScreen path={path} query={serializeQuery(query)} />;
}
