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

import { serializer, type } from '@lowdefy/helpers';

import emitOperatorClosures from '../emitOperatorClosures.js';
import evaluateClosures from '../evaluateClosures.js';
import evaluateWebClosures from '../evaluateWebClosures.js';
import loadClosureModule from './loadClosureModule.js';
import ServerParser from '../../serverParser.js';
import WebParser from '../../webParser.js';
import { collectMarkers, describeErrors } from './parityMatchers.js';

const webContext = {
  _internal: {
    lowdefy: {
      apiResponses: { req: { response: 1 } },
      basePath: '/base',
      home: { pageId: 'home', configured: false },
      i18n: { t: (key) => key },
      inputs: { block: { input: true } },
      lowdefyApp: { app: true },
      lowdefyGlobal: { global: true },
      menus: [{ menus: true }],
      pageId: 'page',
      theme: { theme: true },
      user: { user: true },
      _internal: { globals: { window: { location: { href: 'href' } } } },
    },
  },
  eventLog: [{ eventLog: true }],
  id: 'block',
  jsMap: {},
  requests: [{ requests: true }],
  state: { state: true },
  websockets: { websockets: true },
};

// Both engines must be handed the same tree. `serializer.copy` is what the
// parsers run anyway, and it is what turns the enumerable `~k` of a build
// artefact into the non-enumerable marker the runtime sees.
function normalize(input) {
  return serializer.copy(input);
}

function findNode(tree, key) {
  if (type.isArray(tree)) {
    if (tree['~k'] === key) return tree;
    for (const item of tree) {
      const found = findNode(item, key);
      if (!type.isUndefined(found)) return found;
    }
    return undefined;
  }
  if (!type.isObject(tree)) return undefined;
  if (tree['~k'] === key) return tree;
  for (const objectKey of Object.keys(tree)) {
    const found = findNode(tree[objectKey], key);
    if (!type.isUndefined(found)) return found;
  }
  return undefined;
}

function compare({ viaWalker, viaClosure }) {
  return {
    walker: {
      output: viaWalker.output,
      markers: collectMarkers(viaWalker.output),
      errors: describeErrors(viaWalker.errors),
    },
    closure: {
      output: viaClosure.output,
      markers: collectMarkers(viaClosure.output),
      errors: describeErrors(viaClosure.errors),
    },
  };
}

// One emission per tree, then every closure in the module is compared against
// the walker parsing the same node — the shape V-57 needs, where the engine
// looks a parse root up by its `~k` and falls back to the walker on a miss.
function createParityHarness({ env, operators, operatorPrefix = '_' }) {
  function emit(tree) {
    const code = emitOperatorClosures({ tree, env, operators, operatorPrefix });
    return { code, module: loadClosureModule(code) };
  }

  function runWeb({ tree, closure, actions, args, arrayIndices = [], event, location = 'root' }) {
    const parser = new WebParser({ context: webContext, operators });
    const viaWalker = parser.parse({
      actions,
      args,
      arrayIndices,
      event,
      input: tree,
      location,
      operatorPrefix,
    });
    const viaClosure = evaluateWebClosures({
      actions,
      args,
      arrayIndices,
      closure,
      event,
      location,
      operatorPrefix,
      parser,
    });
    return compare({ viaWalker, viaClosure });
  }

  function runServer({ tree, closure, args, items, location = 'root', payload, state, steps }) {
    const parser = new ServerParser({
      env: { env: true },
      i18n: { t: (key) => key },
      jsMap: {},
      lowdefyApp: { app: true },
      operators,
      organization: { organization: true },
      secrets: { secret: true },
      user: { user: true },
    });
    const viaWalker = parser.parse({
      args,
      input: tree,
      items,
      location,
      operatorPrefix,
      payload,
      state,
      steps,
    });
    const viaClosure = evaluateClosures({
      args,
      closure,
      items,
      location,
      operatorPrefix,
      parser,
      payload,
      state,
      steps,
    });
    return compare({ viaWalker, viaClosure });
  }

  return {
    emit,
    findNode,
    normalize,
    run: env === 'web' ? runWeb : runServer,
  };
}

export default createParityHarness;
export { normalize, findNode, webContext };
