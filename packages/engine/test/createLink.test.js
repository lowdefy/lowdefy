import createLink from '../src/createLink';

const mockBackLink = jest.fn();
const mockNewOriginLink = jest.fn();
const mockSameOriginLink = jest.fn();

beforeEach(() => {
  mockBackLink.mockReset();
  mockNewOriginLink.mockReset();
  mockSameOriginLink.mockReset();
});

test('createLink, link with pageId', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1' });
  link({ pageId: 'page_1', urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    ['/page_1', undefined],
    ['/page_1?p=3', undefined],
  ]);
});

test('createLink, link with pageId new tab', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1', newTab: true });
  link({ pageId: 'page_1', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    ['/page_1', true],
    ['/page_1?p=3', true],
  ]);
});

test('createLink, link with pageId with inputs', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1', input: { a: 1 } });
  link({ pageId: 'page_1', input: { a: 1 }, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    ['/page_1', undefined],
    ['/page_1?p=3', undefined],
  ]);
  expect(lowdefy.inputs).toEqual({
    'page_1:page_1:{}': { a: 1 },
    'page_1:page_1:{"p":3}': { a: 1 },
  });
});

test('createLink, link with url', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'http://localhost:8080/test' });
  link({ url: 'http://localhost:8080/test', urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([
    ['http://localhost:8080/test', undefined],
    ['http://localhost:8080/test?p=3', undefined],
  ]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with url new tab', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'http://localhost:8080/test', newTab: true });
  link({ url: 'http://localhost:8080/test', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([
    ['http://localhost:8080/test', true],
    ['http://localhost:8080/test?p=3', true],
  ]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with home', () => {
  const lowdefy = { inputs: {}, homePageId: 'home' };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true });
  link({ home: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    ['/home', undefined],
    ['/home?p=3', undefined],
  ]);
});

test('createLink, link with home new tab', () => {
  const lowdefy = { inputs: {}, homePageId: 'home' };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true, newTab: true });
  link({ home: true, newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    ['/home', true],
    ['/home?p=3', true],
  ]);
});

test('createLink, link with home with inputs', () => {
  const lowdefy = { inputs: {}, homePageId: 'home' };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true, input: { a: 1 } });
  link({ home: true, input: { a: 1 }, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    ['/home', undefined],
    ['/home?p=3', undefined],
  ]);
  expect(lowdefy.inputs).toEqual({
    'home:home:{}': { a: 1 },
    'home:home:{"p":3}': { a: 1 },
  });
});

test('createLink, link to throw if no params', () => {
  const lowdefy = { inputs: {}, homePageId: 'home' };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  expect(() => link({})).toThrowErrorMatchingInlineSnapshot(`"Invalid Link."`);
});

test('createLink, link with back', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ back: true });
  expect(mockBackLink.mock.calls).toEqual([[]]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with back equal to false is invalid', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    sameOriginLink: mockSameOriginLink,
  });
  expect(() => link({ back: false })).toThrowErrorMatchingInlineSnapshot(`"Invalid Link."`);
});
