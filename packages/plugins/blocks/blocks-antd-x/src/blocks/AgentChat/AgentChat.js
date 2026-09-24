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

import React, { useState } from 'react';
import { createLazyBlock } from '@lowdefy/block-utils';

import DrawerLauncher from './DrawerLauncher.js';
import meta from './meta.js';

// Painted until the implementation loads. Drawer mode shows the same launcher button the
// implementation renders, so first paint has it; inline mode holds the chat's box so the
// page does not shift when the chat arrives.
function AgentChatFallback({ onDrawerOpenRequest, properties }) {
  if (properties.display === 'drawer') {
    return <DrawerLauncher config={properties.drawer} onClick={onDrawerOpenRequest} />;
  }
  return (
    <div
      style={{
        height: properties.height ?? 'calc(100dvh - 170px)',
        maxWidth: properties.maxWidth ?? 800,
        margin: '0 auto',
        width: '100%',
      }}
    />
  );
}

const LazyAgentChat = createLazyBlock({
  load: () => import('./AgentChat.lazy.js'),
  meta,
  Fallback: AgentChatFallback,
});

// Holds a launcher click made before the implementation loaded, so the implementation can
// mount with its drawer already open instead of dropping the click. The click needs no
// preload: the fallback only shows while the mounted wrapper's load is already in flight.
function AgentChat(props) {
  const [drawerOpenRequested, setDrawerOpenRequested] = useState(false);

  return (
    <LazyAgentChat
      {...props}
      drawerOpenRequested={drawerOpenRequested}
      onDrawerOpenRequest={() => setDrawerOpenRequested(true)}
    />
  );
}

AgentChat.displayName = 'AgentChat';
AgentChat.meta = LazyAgentChat.meta;
AgentChat.preload = LazyAgentChat.preload;

export default AgentChat;
