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

import { WebParser } from '@lowdefy/operators';

import Actions from './Actions.js';
import Blocks from './Blocks.js';
import Requests from './Requests.js';
import State from './State.js';

const blockData = ({
  areas,
  blockId,
  blocks,
  events,
  field,
  id,
  layout,
  pageId,
  properties,
  requests,
  required,
  style,
  type,
  validate,
  visible,
}) => ({
  areas,
  blockId,
  blocks,
  events,
  field,
  id,
  layout,
  pageId,
  properties,
  requests,
  required,
  style,
  type,
  validate,
  visible,
});

function getContext({
  config,
  jsMap = {},
  lowdefy,
  resetContext = { reset: false, setReset: () => undefined },
}) {
  if (!config) {
    throw new Error('A page must be provided to get context.');
  }
  const { id } = config;
  if (lowdefy.contexts[id] && !resetContext.reset) {
    // memoize context if already created, eg between page transitions, unless the reset flag is raised
    lowdefy.contexts[id]._internal.update();
    return lowdefy.contexts[id];
  }
  resetContext.setReset(false); // lower context reset flag.
  if (!lowdefy.inputs[id]) {
    lowdefy.inputs[id] = {};
  }
  const ctx = {
    id,
    pageId: config.pageId,
    eventLog: [],
    jsMap,
    requests: {},
    state: {},
    _internal: {
      lowdefy,
      rootBlock: blockData(config), // filter block to prevent circular structure
      update: () => {}, // Initialize update since Requests might call it during context creation
    },
  };
  const _internal = ctx._internal;
  _internal.parser = new WebParser({ context: ctx, operators: lowdefy._internal.operators });
  _internal.State = new State(ctx);
  _internal.Actions = new Actions(ctx);
  _internal.Requests = new Requests(ctx);
  _internal.RootBlocks = new Blocks({
    areas: { root: { blocks: [_internal.rootBlock] } },
    context: ctx,
  });
  _internal.RootBlocks.init();
  _internal.update = () => {
    _internal.RootBlocks.update();
  };
  _internal.runOnInit = async (progress) => {
    progress();
    if (!_internal.onInitDone) {
      await _internal.RootBlocks.areas.root.blocks[0].triggerEvent({
        name: 'onInit',
        progress,
      });
      _internal.update();
      _internal.State.freezeState();
      _internal.onInitDone = true;
    }
  };
  _internal.runOnInitAsync = async (progress) => {
    if (_internal.onInitDone && !_internal.onInitAsyncDone) {
      await _internal.RootBlocks.areas.root.blocks[0].triggerEvent({
        name: 'onInitAsync',
        progress,
      });
      _internal.onInitAsyncDone = true;
    }
  };
  ctx._internal.update();
  lowdefy.contexts[id] = ctx;
  return ctx;
}

export default getContext;
