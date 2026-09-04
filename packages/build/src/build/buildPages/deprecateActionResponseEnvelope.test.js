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

import deprecateActionResponseEnvelope from './deprecateActionResponseEnvelope.js';

function makePage({ actionsPath, actionType = 'CallAPI' }) {
  return {
    id: 'page:home',
    pageId: 'home',
    type: 'Box',
    events: {
      onClick: [
        { id: 'search', type: actionType, params: { endpointId: 'search' }, '~k': 'k_action' },
        {
          id: 'store',
          type: 'SetState',
          params: { value: { _actions: actionsPath, '~k': 'k_ref' } },
        },
      ],
    },
  };
}

function makeContext() {
  const context = { warnings: [] };
  context.handleWarning = (warning) => context.warnings.push(warning);
  return context;
}

function readPath(page) {
  return page.events.onClick[1].params.value._actions;
}

test('deprecateActionResponseEnvelope rewrites the double envelope and warns', () => {
  const context = makeContext();
  const page = makePage({ actionsPath: 'search.response.response.results[0].title' });
  deprecateActionResponseEnvelope({ page, context });
  expect(readPath(page)).toBe('search.response.results[0].title');
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toBe(
    '_actions "search.response.response.results[0].title" reads the removed double "response" envelope of CallAPI action "search". It was read as "search.response.results[0].title" - write that instead. The api record fields (status, success, responseTime) are read with _api.'
  );
  expect(context.warnings[0]).toMatchObject({
    checkSlug: 'actions-response-envelope',
    configKey: 'k_ref',
  });
});

test('deprecateActionResponseEnvelope rewrites the whole-response read', () => {
  const context = makeContext();
  const page = makePage({ actionsPath: 'search.response.response' });
  deprecateActionResponseEnvelope({ page, context });
  expect(readPath(page)).toBe('search.response');
  expect(context.warnings).toHaveLength(1);
});

test('deprecateActionResponseEnvelope rewrites the object form of the operator', () => {
  const context = makeContext();
  const page = makePage({ actionsPath: { key: 'search.response.response.total' } });
  deprecateActionResponseEnvelope({ page, context });
  expect(readPath(page)).toEqual({ key: 'search.response.total' });
  expect(context.warnings).toHaveLength(1);
});

test('deprecateActionResponseEnvelope leaves the collapsed spelling alone', () => {
  const context = makeContext();
  const page = makePage({ actionsPath: 'search.response.total' });
  deprecateActionResponseEnvelope({ page, context });
  expect(readPath(page)).toBe('search.response.total');
  expect(context.warnings).toEqual([]);
});

test('deprecateActionResponseEnvelope leaves a non-CallAPI action alone', () => {
  const context = makeContext();
  const page = makePage({ actionsPath: 'search.response.response.total', actionType: 'Request' });
  deprecateActionResponseEnvelope({ page, context });
  expect(readPath(page)).toBe('search.response.response.total');
  expect(context.warnings).toEqual([]);
});

test('deprecateActionResponseEnvelope leaves a read addressed at another action id alone', () => {
  const context = makeContext();
  const page = makePage({ actionsPath: 'other.response.response.total' });
  deprecateActionResponseEnvelope({ page, context });
  expect(readPath(page)).toBe('other.response.response.total');
  expect(context.warnings).toEqual([]);
});

test('deprecateActionResponseEnvelope skips an operator-computed path', () => {
  const context = makeContext();
  const page = makePage({ actionsPath: { key: { _state: 'which' } } });
  deprecateActionResponseEnvelope({ page, context });
  expect(readPath(page)).toEqual({ key: { _state: 'which' } });
  expect(context.warnings).toEqual([]);
});
