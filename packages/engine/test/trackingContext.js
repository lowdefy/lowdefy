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
import { applyArrayIndices, serializer, type } from '@lowdefy/helpers';

import testContext from './testContext.js';
import testOperators from './testOperators.js';

// Engine tests of dependency tracking use stub recording, so they do not depend on the operator
// plugins' own tracking declarations: each test operator is wrapped to report its reads to the
// recorder the engine has open, in the recorder contract's keys. The wrapper declares itself pure,
// so a parser that records declared operators adds only its pure signal on top.

function objectReadKeys({ arrayIndices, namespace, params }) {
  if (params === true) return [`${namespace}:*`];
  if (type.isString(params) || type.isInt(params)) {
    return [`${namespace}:${applyArrayIndices(arrayIndices, String(params))}`];
  }
  if (!type.isObject(params)) return [];
  if (params.all === true) return [`${namespace}:*`];
  if (params.key === null) return [];
  return [`${namespace}:${applyArrayIndices(arrayIndices, String(params.key))}`];
}

// _type and _regex read their `key`, else the block's own value at `location`, unless given `on`.
function locationReadKeys({ location, params }) {
  if (type.isObject(params) && Object.prototype.hasOwnProperty.call(params, 'on')) return [];
  const key = type.isObject(params) ? params.key : undefined;
  return [`state:${type.isNone(key) ? location : key}`];
}

const stubDeclarations = {
  _actions: 'pure',
  _divide: 'pure',
  _eq: 'pure',
  _error: 'pure',
  _event: 'pure',
  _global: ({ arrayIndices, params }) =>
    objectReadKeys({ arrayIndices, namespace: 'global', params }),
  _if_none: 'pure',
  _json: 'pure',
  _mql: 'untracked',
  _not: 'pure',
  _regex: locationReadKeys,
  _state: ({ arrayIndices, params }) =>
    objectReadKeys({ arrayIndices, namespace: 'state', params }),
  _string: 'pure',
  _sum: 'pure',
  _type: locationReadKeys,
};

function createStubRecordingOperators({ getRecorder }) {
  const operators = {};
  Object.entries(testOperators).forEach(([name, operatorFn]) => {
    const declaration = stubDeclarations[name] ?? 'untracked';
    function stubOperator(callOptions) {
      const recorder = getRecorder();
      if (!type.isNone(recorder)) {
        if (declaration === 'untracked') {
          recorder.untracked(name);
        } else if (type.isFunction(declaration)) {
          declaration(callOptions).forEach((key) => recorder.read(key));
        }
      }
      return operatorFn(callOptions);
    }
    stubOperator.tracking = { kind: 'pure' };
    operators[name] = stubOperator;
  });
  return operators;
}

// A view of the context whose readRecorder is always null: a parser built on it never records, the
// way a parser without recording support behaves.
function createBlindContext(context) {
  const internal = new Proxy(context._internal, {
    get: (target, key) => (key === 'readRecorder' ? null : target[key]),
  });
  return new Proxy(context, {
    get: (target, key) => (key === '_internal' ? internal : target[key]),
  });
}

// recording: 'stub' (every test operator reports its reads through the stub declarations above),
// 'parser' (the parser records through the operators' own tracking declarations) or 'none' (the
// parser never records).
// tracking: false runs every update as a full pass, through the engine option
// lowdefy._internal.dependencyTracking.
async function trackingContext({ lowdefy = {}, pageConfig, recording = 'stub', tracking = true }) {
  const context = await testContext({
    lowdefy: {
      ...lowdefy,
      _internal: { ...lowdefy._internal, dependencyTracking: tracking },
    },
    // buildTestPage rewrites the config it is given, and tests share configs between contexts.
    pageConfig: serializer.copy(pageConfig),
  });
  if (recording === 'stub') {
    context._internal.parser = new WebParser({
      context,
      operators: createStubRecordingOperators({
        getRecorder: () => context._internal.readRecorder,
      }),
    });
  }
  if (recording === 'none') {
    context._internal.parser = new WebParser({
      context: createBlindContext(context),
      operators: testOperators,
    });
  }
  // A full pass, so every block's reads are recorded through the parser now in place.
  context._internal.update();
  return context;
}

function walkBlocks(slots, fn) {
  slots.loopBlocks((block) => {
    fn(block);
    block.loopSubSlots((subSlots) => walkBlocks(subSlots, fn));
  });
}

// Counts self-evaluations per blockId from now on, including blocks created later (list rows).
function countEvaluations(context) {
  const counts = {};
  const wrap = (block) => {
    if (block.countedEvaluations) return;
    block.countedEvaluations = true;
    const { evaluateSelf } = block;
    block.evaluateSelf = (...args) => {
      counts[block.blockId] = (counts[block.blockId] ?? 0) + 1;
      return evaluateSelf(...args);
    };
  };
  walkBlocks(context._internal.RootSlots, wrap);
  const { update } = context._internal;
  context._internal.update = (options) => {
    walkBlocks(context._internal.RootSlots, wrap);
    update(options);
  };
  return {
    counts,
    reset: () => {
      Object.keys(counts).forEach((key) => delete counts[key]);
    },
  };
}

// Records the ids of blocks whose updater fires, the blocks React would re-render.
function captureRenders(context) {
  const rendered = new Set();
  context._internal.updaters = new Proxy({}, { get: (_, id) => () => rendered.add(id) });
  return rendered;
}

// Everything a pass produces that a caller can observe: each block's evaluated output (functions
// dropped, as evalToString does), its validation display, and the state.
function snapshot(context) {
  const blocks = {};
  walkBlocks(context._internal.RootSlots, (block) => {
    blocks[block.blockId] = {
      eval: block.evalToString(),
      showValidation: block.showValidation,
      visible: block.visibleEval.output,
    };
  });
  return { blocks, state: serializer.serializeToString(context.state) };
}

export { captureRenders, countEvaluations, snapshot, trackingContext, walkBlocks };
