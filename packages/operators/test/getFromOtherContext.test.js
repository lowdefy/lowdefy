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

import getFromOtherContext from '../src/getFromOtherContext';

const defaultArrayIndices = [];
const location = 'location';

const context = {
  id: 'own',
  state: {
    string: 'state',
  },
  updateListeners: new Set(),
};

const otherContext = {
  id: 'other',
  state: {
    string: 'state-other',
  },
  updateListeners: new Set(),
};
const contexts = {
  own: context,
  other: otherContext,
};

test('get from another context', () => {
  expect(
    getFromOtherContext({
      params: { key: 'string', contextId: 'other' },
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator: '_state',
      location,
      env: 'web',
    })
  ).toEqual('state-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('get from another context, all', () => {
  expect(
    getFromOtherContext({
      params: { all: true, contextId: 'other' },
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator: '_state',
      location,
      env: 'web',
    })
  ).toEqual({
    string: 'state-other',
  });
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('get from another context, contextId not a string', () => {
  expect(() =>
    getFromOtherContext({
      params: { key: 'string', contextId: true },
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator: '_state',
      location,
      env: 'web',
    })
  ).toThrow(
    'Operator Error: _state.contextId must be of type string. Received: {"key":"string","contextId":true} at location.'
  );
});

test('get from another context, object not supported', () => {
  expect(() =>
    getFromOtherContext({
      params: { key: 'string', contextId: 'other' },
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator: '_other',
      location,
      env: 'web',
    })
  ).toThrow(
    'Operator Error: Cannot use _other to get from another context. Received: {"key":"string","contextId":"other"} at location.'
  );
});

test('get from another context, target context not found', () => {
  expect(() =>
    getFromOtherContext({
      params: { key: 'string', contextId: 'not_there' },
      context,
      contexts,
      arrayIndices: defaultArrayIndices,
      operator: '_state',
      location,
      env: 'web',
    })
  ).toThrow(
    'Operator Error: Context not_there not found. Received: {"key":"string","contextId":"not_there"} at location.'
  );
});
