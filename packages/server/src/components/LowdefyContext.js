/*
  Copyright 2020-2021 Lowdefy, Inc

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

import callRequest from '../utils/callRequest.js';
import blockComponents from '../../build/plugins/blocks.js';
import operators from '../../build/plugins/operatorsClient.js';
import components from './components.js';

const LowdefyContext = ({ children }) => {
  const lowdefy = {
    _internal: {
      blockComponents,
      callRequest,
      components,
      document,
      operators,
      updaters: {},
      window,
      displayMessage: ({ content }) => {
        console.log(content);
        return () => undefined;
      },
      link: () => undefined,
    },
    contexts: {},
    inputs: {},
    lowdefyGlobal: {},
  };
  lowdefy._internal.updateBlock = (blockId) =>
    lowdefy._internal.updaters[blockId] && lowdefy._internal.updaters[blockId]();
  return <>{children(lowdefy)}</>;
};

export default LowdefyContext;
