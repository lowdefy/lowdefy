/* eslint-disable max-classes-per-file */
import WebParser from '../../../src/webParser';

const arrayIndices = [1];

test('add listener if contextId is not equal to own contextId', () => {
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
  const input = {
    _state: {
      key: 'string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('do not add listener if contextId is equal to own contextId', () => {
  const context = {
    id: 'own',
    state: {
      string: 'state',
      arr: [{ a: 'state1' }, { a: 'state2' }],
    },
    updateListeners: new Set(),
  };

  const otherContext = {
    id: 'other',
    state: {
      string: 'state-other',
      arr: [{ a: 'state1-other' }, { a: 'state2-other' }],
    },
    updateListeners: new Set(),
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
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state');
  expect(context.updateListeners).toEqual(new Set());
});

test('add listener for _state', () => {
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
  const input = {
    _state: {
      key: 'string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _action_log', () => {
  const context = {
    id: 'own',
    actionLog: [
      {
        string: 'state',
      },
    ],
    updateListeners: new Set(),
  };

  const otherContext = {
    id: 'other',
    actionLog: [
      {
        string: 'state-other',
      },
    ],
    updateListeners: new Set(),
  };

  const contexts = {
    own: context,
    other: otherContext,
  };
  const input = {
    _action_log: {
      key: '0.string',
      contextId: 'other',
    },
  };
  expect(context.updateListeners).toEqual(new Set());
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('state-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _input', () => {
  const context = {
    id: 'own',
    input: {
      string: 'input',
    },
    updateListeners: new Set(),
  };

  const otherContext = {
    id: 'other',
    input: {
      string: 'input-other',
    },
    updateListeners: new Set(),
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
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('input-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _url_query', () => {
  const context = {
    id: 'own',
    urlQuery: {
      string: 'url',
    },
    updateListeners: new Set(),
  };

  const otherContext = {
    id: 'other',
    urlQuery: {
      string: 'url-other',
    },
    updateListeners: new Set(),
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
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('url-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});

test('add listener for _request_details', () => {
  const context = {
    id: 'own',
    requests: {
      string: 'requests',
    },
    updateListeners: new Set(),
  };

  const otherContext = {
    id: 'other',
    requests: {
      string: 'requests-other',
    },
    updateListeners: new Set(),
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
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('requests-other');
  expect(otherContext.updateListeners).toEqual(new Set(['own']));
});
