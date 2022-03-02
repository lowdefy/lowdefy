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

import { WebParser } from '@lowdefy/operators';

import Actions from '../src/Actions.js';
import Blocks from '../src/Blocks.js';
import Requests from '../src/Requests.js';
import State from '../src/State.js';

const testContext = ({ lowdefy, operators, rootBlock, initState = {} }) => {
  const testLowdefy = {
    inputs: { test: {} },
    urlQuery: {},
    ...lowdefy,
    _internal: {
      displayMessage: () => () => undefined,
      updateBlock: () => {},
      ...lowdefy._internal,
    },
  };
  const ctx = {
    id: 'test',
    pageId: rootBlock.blockId,
    eventLog: [],
    requests: {},
    state: {},
    _internal: {
      lowdefy: testLowdefy,
      rootBlock,
    },
  };
  const _internal = ctx._internal;
  _internal.parser = new WebParser({ context: ctx, contexts: {}, operators: operators || {} });
  _internal.State = new State(ctx);
  _internal.Actions = new Actions(ctx);
  _internal.Requests = new Requests(ctx);
  _internal.RootBlocks = new Blocks({
    areas: _internal.rootBlock.areas,
    context: ctx,
  });
  _internal.RootBlocks.init();
  _internal.update = () => {
    _internal.RootBlocks.update();
  };
  if (initState) {
    Object.keys(initState).forEach((key) => {
      _internal.State.set(key, initState[key]);
    });
    _internal.RootBlocks.reset();
  }
  _internal.update();
  _internal.State.freezeState();
  return ctx;
};

export default testContext;
