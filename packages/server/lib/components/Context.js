/*
  Copyright 2020-2022 Lowdefy, Inc

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
import getContext from '@lowdefy/engine';

import MountEvents from './MountEvents.js';

const Context = ({ children, config, lowdefy, progress }) => {
  const context = getContext({ config, lowdefy });
  return (
    <MountEvents
      context={context}
      ename="onInit"
      triggerEvent={async () => {
        progress.dispatch({
          type: 'increment',
        });
        if (!context._internal.State.initialized) {
          await context._internal.RootBlocks.areas.root.blocks[0].triggerEvent({
            name: 'onInit',
            progress: () => {
              progress.dispatch({
                type: 'increment',
              });
            },
          });
          context._internal.State.freezeState();
        }
      }}
      triggerEventAsync={() => {
        if (!context._internal.State.initialized) {
          context._internal.RootBlocks.areas.root.blocks[0].triggerEvent({
            name: 'onInitAsync',
            progress: () => {
              progress.dispatch({
                type: 'increment',
              });
            },
          });
        }
      }}
    >
      {(loadingOnInit) => {
        if (loadingOnInit) return '';
        return children(context);
      }}
    </MountEvents>
  );
};

export default Context;
