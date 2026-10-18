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

import React, { useEffect } from 'react';
import { createPageLifecycleManager, getContextKey } from '@lowdefy/client-core';
import getContext from '@lowdefy/engine';

import MountEvents from './MountEvents.js';

const PageLifecycleEffect = ({ context }) => {
  useEffect(() => {
    const manager = createPageLifecycleManager();
    manager.init(context);
    return () => manager.destroy();
  }, [context]);
  return null;
};

const WebSocketsEffect = ({ context }) => {
  useEffect(() => {
    context._internal.WebSockets.subscribeAll();
    return () => context._internal.WebSockets.unsubscribeAll();
  }, [context]);
  return null;
};

// The page's engine context. The app events run once per app load, when the first page mounts;
// the page onInit waits for the app onInit, but not for the app onInitAsync. The page's blocks
// render once onInit is done.
const Context = ({
  appContext,
  children,
  config,
  globals,
  instanceId,
  jsMap,
  lowdefy,
  pathParams,
  resetContext,
}) => {
  const context = getContext({
    config,
    globals,
    instanceId,
    jsMap,
    lowdefy,
    pathParams,
    resetContext,
  });
  const progress = () => {
    lowdefy._internal.progress.dispatch({ type: 'increment' });
  };
  return (
    <MountEvents
      key={getContextKey(context)}
      context={context}
      triggerEvent={async () => {
        await appContext._internal.runOnInit(progress);
        appContext._internal.runOnInitAsync(progress);
        await context._internal.runOnInit(progress);
      }}
      triggerEventAsync={() => {
        context._internal.runOnInitAsync(progress);
      }}
      waitForMount={true}
    >
      {(loadingOnInit) => {
        if (loadingOnInit) return null;
        return (
          <>
            <PageLifecycleEffect context={context} />
            <WebSocketsEffect context={context} />
            {children(context)}
          </>
        );
      }}
    </MountEvents>
  );
};

export default Context;
