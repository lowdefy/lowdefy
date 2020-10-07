import makeContextId from '../src/makeContextId';

test('makeContextId, empty urlQuery', () => {
  expect(
    makeContextId({
      blockId: 'blockId',
      branch: 'branch',
      pageId: 'pageId',
      search: {},
    })
  ).toEqual('branch:pageId:blockId:{}');
});

test('makeContextId, search', () => {
  expect(
    makeContextId({
      blockId: 'blockId',
      branch: 'branch',
      pageId: 'pageId',
      urlQuery: { a: 1 },
    })
  ).toEqual('branch:pageId:blockId:{"a":1}');
});

test('makeContextId, undefined urlQuery', () => {
  expect(
    makeContextId({
      blockId: 'blockId',
      branch: 'branch',
      pageId: 'pageId',
    })
  ).toEqual('branch:pageId:blockId:{}');
});

test('makeContextId, undefined blockId', () => {
  expect(() =>
    makeContextId({
      branch: 'branch',
      pageId: 'pageId',
      search: {},
    })
  ).toThrow('Expected string for parameter blockId, received undefined');
});

test('makeContextId, blockId not a string', () => {
  expect(() =>
    makeContextId({
      blockId: 1,
      branch: 'branch',
      pageId: 'pageId',
      search: {},
    })
  ).toThrow('Expected string for parameter blockId, received 1');
});

test('makeContextId, undefined pageId', () => {
  expect(() =>
    makeContextId({
      branch: 'branch',
      blockId: 'blockId',
      search: {},
    })
  ).toThrow('Expected string for parameter pageId, received undefined');
});

test('makeContextId, pageId not a string', () => {
  expect(() =>
    makeContextId({
      pageId: 1,
      branch: 'branch',
      blockId: 'blockId',
      search: {},
    })
  ).toThrow('Expected string for parameter pageId, received 1');
});

test('makeContextId, undefined branch', () => {
  expect(() =>
    makeContextId({
      blockId: 'blockId',
      pageId: 'pageId',
      search: {},
    })
  ).toThrow('Expected string for parameter branch, received undefined');
});

test('makeContextId, branch not a string', () => {
  expect(() =>
    makeContextId({
      branch: 1,
      blockId: 'blockId',
      pageId: 'pageId',
      search: {},
    })
  ).toThrow('Expected string for parameter branch, received 1');
});
