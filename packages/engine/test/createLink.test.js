import createLink from '../src/createLink.js';

const mockBackLink = jest.fn();
const mockDisabledLink = jest.fn();
const mockNewOriginLink = jest.fn();
const mockNoLink = jest.fn();
const mockSameOriginLink = jest.fn();

beforeEach(() => {
  mockBackLink.mockReset();
  mockDisabledLink.mockReset();
  mockNewOriginLink.mockReset();
  mockNoLink.mockReset();
  mockSameOriginLink.mockReset();
});

test('createLink, link with pageId', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1' });
  link({ pageId: 'page_1', urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    [
      {
        href: '/page_1',
        pageId: 'page_1',
      },
    ],
    [
      {
        href: '/page_1?p=3',
        pageId: 'page_1',
        urlQuery: {
          p: 3,
        },
      },
    ],
  ]);
});

test('createLink, link with pageId new tab', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1', newTab: true });
  link({ pageId: 'page_1', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    [
      {
        href: '/page_1',
        pageId: 'page_1',
        newTab: true,
      },
    ],
    [
      {
        href: '/page_1?p=3',
        pageId: 'page_1',
        newTab: true,
        urlQuery: {
          p: 3,
        },
      },
    ],
  ]);
});

test('createLink, link with pageId with inputs', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ pageId: 'page_1', input: { a: 1 } });
  link({ pageId: 'page_2', input: { a: 2 }, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    [
      {
        href: '/page_1',
        input: {
          a: 1,
        },
        pageId: 'page_1',
      },
    ],
    [
      {
        href: '/page_2?p=3',
        input: {
          a: 2,
        },
        pageId: 'page_2',
        urlQuery: {
          p: 3,
        },
      },
    ],
  ]);
  expect(lowdefy.inputs).toEqual({
    'page:page_1': { a: 1 },
    'page:page_2': { a: 2 },
  });
});

test('createLink, link with url and protocol', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'http://localhost:8080/test' });
  link({ url: 'http://localhost:8080/test', urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([
    [
      {
        href: 'http://localhost:8080/test',
        url: 'http://localhost:8080/test',
      },
    ],
    [
      {
        href: 'http://localhost:8080/test?p=3',
        url: 'http://localhost:8080/test',
        urlQuery: {
          p: 3,
        },
      },
    ],
  ]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with url new tab and protocol', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'http://localhost:8080/test', newTab: true });
  link({ url: 'http://localhost:8080/test', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([
    [
      {
        href: 'http://localhost:8080/test',
        url: 'http://localhost:8080/test',
        newTab: true,
      },
    ],
    [
      {
        href: 'http://localhost:8080/test?p=3',
        url: 'http://localhost:8080/test',
        urlQuery: {
          p: 3,
        },
        newTab: true,
      },
    ],
  ]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with url and no protocol', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ url: 'external.com/test', newTab: true });
  link({ url: 'external.com/test', newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([
    [
      {
        href: 'https://external.com/test',
        url: 'external.com/test',
        newTab: true,
      },
    ],
    [
      {
        href: 'https://external.com/test?p=3',
        url: 'external.com/test',
        urlQuery: {
          p: 3,
        },
        newTab: true,
      },
    ],
  ]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with home, not configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home', configured: false } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true });
  link({ home: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    [
      {
        home: true,
        href: '/home',
      },
    ],
    [
      {
        home: true,
        href: '/home?p=3',
        urlQuery: {
          p: 3,
        },
      },
    ],
  ]);
});

test('createLink, link with home, configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home', configured: true } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true });
  link({ home: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    [
      {
        home: true,
        href: '/',
      },
    ],
    [
      {
        home: true,
        href: '/?p=3',
        urlQuery: {
          p: 3,
        },
      },
    ],
  ]);
});

test('createLink, link with home new tab, not configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true, newTab: true });
  link({ home: true, newTab: true, urlQuery: { p: 3 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    [{ home: true, href: '/home', newTab: true }],
    [
      {
        home: true,
        href: '/home?p=3',
        newTab: true,
        urlQuery: {
          p: 3,
        },
      },
    ],
  ]);
});

test('createLink, link with home with inputs, not configured', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ home: true, input: { a: 1 } });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([
    [
      {
        home: true,
        href: '/home',
        input: {
          a: 1,
        },
      },
    ],
  ]);
  expect(lowdefy.inputs).toEqual({
    'page:home': { a: 1 },
  });
});

test('createLink, no params calls noLink', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({});
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([[{}]]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, disabled calls disabledLink', () => {
  const lowdefy = { inputs: {}, home: { pageId: 'home' } };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ disabled: true, home: true });
  expect(mockBackLink.mock.calls).toEqual([]);
  expect(mockDisabledLink.mock.calls).toEqual([
    [
      {
        disabled: true,
        home: true,
      },
    ],
  ]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with back', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  link({ back: true });
  expect(mockBackLink.mock.calls).toEqual([
    [
      {
        back: true,
      },
    ],
  ]);
  expect(mockDisabledLink.mock.calls).toEqual([]);
  expect(mockNoLink.mock.calls).toEqual([]);
  expect(mockNewOriginLink.mock.calls).toEqual([]);
  expect(mockSameOriginLink.mock.calls).toEqual([]);
});

test('createLink, link with more than one parameter is invalid.', () => {
  const lowdefy = { inputs: {} };
  const link = createLink({
    backLink: mockBackLink,
    disabledLink: mockDisabledLink,
    lowdefy,
    newOriginLink: mockNewOriginLink,
    noLink: mockNoLink,
    sameOriginLink: mockSameOriginLink,
  });
  expect(() => link({ back: true, home: true })).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Link: To avoid ambiguity, only one of 'back', 'home', 'pageId' or 'url' can be defined."`
  );
});
