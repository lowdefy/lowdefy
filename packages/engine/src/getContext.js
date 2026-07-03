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

import { WebParser } from '@lowdefy/operators';

import Actions from './Actions.js';
import Slots from './Slots.js';
import Requests from './Requests.js';
import State from './State.js';
import WebSockets from './WebSockets.js';

const blockData = (config) => {
  const {
    slots,
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
    subscriptions,
    type,
    validate,
    visible,
  } = config;
  const result = {
    slots,
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
    subscriptions,
    type,
    validate,
    visible,
  };
  // Preserve ~k (configKey) for error tracing - it's non-enumerable so must be copied explicitly
  if (config['~k']) {
    Object.defineProperty(result, '~k', {
      value: config['~k'],
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
  return result;
};

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
  // Dynamic pages are server-resolved per request — a context memoized across
  // navigations would render the previous request's content. Rebuild when a
  // new config object arrives (a fresh fetch), but stay memoized across
  // re-renders of the same config: getContext runs in the render body, so
  // rebuilding per render would loop.
  const sameDynamicConfig =
    config.dynamic !== true || lowdefy.contexts[id]?._internal.pageConfig === config;
  if (lowdefy.contexts[id] && !resetContext.reset && sameDynamicConfig) {
    // memoize context if already created, eg between page transitions, unless the reset flag is raised
    lowdefy.contexts[id]._internal.update();
    return lowdefy.contexts[id];
  }
  // Lower the context reset flag — only when raised: setReset is a React
  // state setter on the Reload component, and getContext runs in the render
  // body, so calling it on dynamic rebuilds (reset already false) would
  // setState another component mid-render.
  if (resetContext.reset) {
    resetContext.setReset(false);
  }
  if (!lowdefy.inputs[id]) {
    lowdefy.inputs[id] = {};
  }
  // When rebuilding over a live context (dynamic page navigation or reset),
  // the previous context's Block components are still mounted with updaters
  // registered under the same block ids. Construction renders below would
  // call setState on them mid-render (a React violation) — suppress
  // updateBlock for the construction; they re-render when the new context
  // propagates through React.
  const rebuildingOverLiveContext =
    Boolean(lowdefy.contexts[id]) && typeof lowdefy._internal.updateBlock === 'function';
  const mountedUpdateBlock = lowdefy._internal.updateBlock;
  if (rebuildingOverLiveContext) {
    lowdefy._internal.updateBlock = () => {};
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
      // Config object reference for dynamic page memoization — identity marks
      // which fetch this context was built from.
      pageConfig: config,
      rootBlock: blockData(config), // filter block to prevent circular structure
      update: () => {}, // Initialize update since Requests might call it during context creation
    },
  };
  try {
    const _internal = ctx._internal;
    _internal.parser = new WebParser({ context: ctx, operators: lowdefy._internal.operators });
    _internal.State = new State(ctx);
    _internal.Actions = new Actions(ctx);
    _internal.Requests = new Requests(ctx);
    _internal.WebSockets = new WebSockets(ctx);
    _internal.RootSlots = new Slots({
      slots: { root: { blocks: [_internal.rootBlock] } },
      context: ctx,
    });
    _internal.RootSlots.init();
    _internal.update = () => {
      _internal.RootSlots.update();
    };
    _internal.runOnInit = async (progress) => {
      progress();
      if (!_internal.onInitDone) {
        await _internal.RootSlots.slots.root.blocks[0].triggerEvent({
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
        await _internal.RootSlots.slots.root.blocks[0].triggerEvent({
          name: 'onInitAsync',
          progress,
        });
        _internal.onInitAsyncDone = true;
      }
    };
    ctx._internal.update();
  } finally {
    if (rebuildingOverLiveContext) {
      lowdefy._internal.updateBlock = mountedUpdateBlock;
    }
  }
  lowdefy.contexts[id] = ctx;
  return ctx;
}

export default getContext;
