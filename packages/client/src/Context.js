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
import getContext from '@lowdefy/engine';

import createPageLifecycleManager from './createPageLifecycleManager.js';
import createShortcutManager from './createShortcutManager.js';
import MountEvents from './MountEvents.js';

const ShortcutEffect = ({ context }) => {
  useEffect(() => {
    const manager = createShortcutManager();
    manager.init(context);
    return () => manager.destroy();
  }, [context]);
  return null;
};

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

const Context = ({ appContext, children, config, jsMap, lowdefy, resetContext }) => {
  const context = getContext({ config, jsMap, lowdefy, resetContext });
  const progress = () => {
    lowdefy._internal.progress.dispatch({
      type: 'increment',
    });
  };
  return (
    <MountEvents
      context={context}
      triggerEvent={async () => {
        // The app events run once per app load, when the first page mounts. The
        // page onInit waits for the app onInit, but not for the app onInitAsync.
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
        if (loadingOnInit) return '';
        return (
          <>
            <ShortcutEffect context={context} />
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
