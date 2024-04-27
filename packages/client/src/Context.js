/*
  Copyright 2020-2024 Lowdefy, Inc

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

const Context = ({ children, config, jsMap, lowdefy, resetContext }) => {
  const context = getContext({ config, jsMap, lowdefy, resetContext });
  return (
    <MountEvents
      context={context}
      triggerEvent={async () => {
        await context._internal.runOnInit(() => {
          lowdefy._internal.progress.dispatch({
            type: 'increment',
          });
        });
      }}
      triggerEventAsync={() => {
        context._internal.runOnInitAsync(() => {
          lowdefy._internal.progress.dispatch({
            type: 'increment',
          });
        });
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
