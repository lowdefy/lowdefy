/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { jest } from '@jest/globals';

import addDefaultPages from './addDefaultPages.js';
import testContext from '../../test/testContext.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('addDefaultPages, no pages array', () => {
  const components = {};
  const res = addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: '404',
        type: 'Result',
        style: {
          minHeight: '100vh',
        },
        properties: {
          status: 'info',
          subTitle: 'Sorry, the page you are visiting does not exist.',
          title: '404',
        },
        areas: {
          extra: {
            blocks: [
              {
                events: {
                  onClick: [
                    {
                      id: 'home',
                      type: 'Link',
                      params: {
                        home: true,
                      },
                    },
                  ],
                },
                id: 'home',
                properties: {
                  title: 'Go to home page',
                },
                type: 'Button',
              },
            ],
          },
        },
      },
    ],
  });
});

test('addDefaultPages, empty pages array', () => {
  const components = { pages: [] };
  const res = addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: '404',
        type: 'Result',
        style: {
          minHeight: '100vh',
        },
        properties: {
          status: 'info',
          subTitle: 'Sorry, the page you are visiting does not exist.',
          title: '404',
        },
        areas: {
          extra: {
            blocks: [
              {
                events: {
                  onClick: [
                    {
                      id: 'home',
                      type: 'Link',
                      params: {
                        home: true,
                      },
                    },
                  ],
                },
                id: 'home',
                properties: {
                  title: 'Go to home page',
                },
                type: 'Button',
              },
            ],
          },
        },
      },
    ],
  });
});

test('addDefaultPages, pages without 404 page', () => {
  const components = { pages: [{ id: 'page1', type: 'PageHeaderMenu' }] };
  const res = addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page1',
        type: 'PageHeaderMenu',
      },
      {
        id: '404',
        type: 'Result',
        style: {
          minHeight: '100vh',
        },
        properties: {
          status: 'info',
          subTitle: 'Sorry, the page you are visiting does not exist.',
          title: '404',
        },
        areas: {
          extra: {
            blocks: [
              {
                events: {
                  onClick: [
                    {
                      id: 'home',
                      type: 'Link',
                      params: {
                        home: true,
                      },
                    },
                  ],
                },
                id: 'home',
                properties: {
                  title: 'Go to home page',
                },
                type: 'Button',
              },
            ],
          },
        },
      },
    ],
  });
});

test('addDefaultPages, pages with 404 page, should not overwrite', () => {
  const components = {
    pages: [
      { id: 'page1', type: 'PageHeaderMenu' },
      { id: '404', type: 'PageHeaderMenu' },
    ],
  };
  const res = addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page1',
        type: 'PageHeaderMenu',
      },
      {
        id: '404',
        type: 'PageHeaderMenu',
      },
    ],
  });
});

test('addDefaultPages, pages not an array', () => {
  const components = {
    pages: { id: 'page1', type: 'PageHeaderMenu' },
  };
  expect(() => addDefaultPages({ components, context })).toThrow('lowdefy.pages is not an array.');
});

test('addDefaultPages, with a page not an object', () => {
  const components = {
    pages: [null],
  };
  expect(() => addDefaultPages({ components, context })).toThrow(
    'pages[0] is not an object. Received null'
  );
});

test('addDefaultPages, pages are copied', () => {
  const components1 = {};
  const res1 = addDefaultPages({ components: components1, context });
  const page1 = res1.pages[0];
  page1.id = 'page:404';
  const components2 = {};
  const res2 = addDefaultPages({ components: components2, context });
  expect(res2.pages[0].id).toEqual('404');
});
