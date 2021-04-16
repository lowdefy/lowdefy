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

/* eslint-disable max-classes-per-file */
import WebParser from '../../../src/webParser';
import { operators } from '../../testContext';

const arrayIndices = [1];

const lowdefy = {
  inputs: {},
};

test('add listener if contextId is not equal to own contextId', async () => {
  const context = {
    id: 'own',
    lowdefy,
    state: {
      string: 'state',
    },
    updateListeners: new Set(),
    operators,
  };

  const otherContext = {
    id: 'other',
    lowdefy,
    state: {
      string: 'state-other',
    },
    updateListeners: new Set(),
    operators,
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _state: {
      key: 'string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('do not add listener if contextId is equal to own contextId', async () => {
  const context = {
    id: 'own',
    lowdefy,
    state: {
      string: 'state',
      arr: [{ a: 'state1' }, { a: 'state2' }],
    },
    updateListeners: new Set(),
    operators,
  };

  const otherContext = {
    id: 'other',
    lowdefy,
    state: {
      string: 'state-other',
      arr: [{ a: 'state1-other' }, { a: 'state2-other' }],
    },
    updateListeners: new Set(),
    operators,
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _state: {
      key: 'string',
      contextId: 'own',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state');
  expect(context.updateListeners).toEqual(new Set());
});

test('add listener for _state', async () => {
  const context = {
    id: 'own',
    lowdefy,
    state: {
      string: 'state',
    },
    updateListeners: new Set(),
    operators,
  };

  const otherContext = {
    id: 'other',
    lowdefy,
    state: {
      string: 'state-other',
    },
    updateListeners: new Set(),
    operators,
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _state: {
      key: 'string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _event_log', async () => {
  const context = {
    id: 'own',
    lowdefy,
    eventLog: [
      {
        string: 'state',
      },
    ],
    updateListeners: new Set(),
    operators,
  };

  const otherContext = {
    id: 'other',
    lowdefy,
    eventLog: [
      {
        string: 'state-other',
      },
    ],
    updateListeners: new Set(),
    operators,
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _event_log: {
      key: '0.string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _input', async () => {
  const lowdefy = {
    inputs: {
      own: {
        string: 'input',
      },
      other: {
        string: 'input-other',
      },
    },
  };
  const context = {
    id: 'own',
    lowdefy,
    updateListeners: new Set(),
    operators,
  };

  const otherContext = {
    id: 'other',
    lowdefy,
    updateListeners: new Set(),
    operators,
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _input: {
      key: 'string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('input-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _url_query', async () => {
  const lowdefy = {
    urlQuery: {
      string: 'url',
    },
    inputs: {},
  };
  const context = {
    id: 'own',
    lowdefy,
    updateListeners: new Set(),
    operators,
  };

  const otherContext = {
    id: 'other',
    lowdefy,
    updateListeners: new Set(),
    operators,
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _url_query: {
      key: 'string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('url');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _request_details', async () => {
  const context = {
    id: 'own',
    lowdefy,
    requests: {
      string: 'requests',
    },
    updateListeners: new Set(),
    operators,
  };

  const otherContext = {
    id: 'other',
    lowdefy,
    requests: {
      string: 'requests-other',
    },
    updateListeners: new Set(),
    operators,
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _request_details: {
      key: 'string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('requests-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});
