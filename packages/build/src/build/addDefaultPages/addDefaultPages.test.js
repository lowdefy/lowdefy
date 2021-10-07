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

import addDefaultPages from './addDefaultPages';
import testContext from '../../test/testContext';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('addDefaultPages, no pages array', async () => {
  const components = {};
  const res = await addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: '404',
        type: 'Result',
        style: {
          minHeight: '100vh',
        },
        properties: {
          status: 404,
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
                      params: {
                        home: true,
                      },
                      type: 'Link',
                    },
                  ],
                },
                id: 'home',
                properties: {
                  icon: 'HomeOutlined',
                  title: 'Go to home page',
                  type: 'Link',
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

test('addDefaultPages, empty pages array', async () => {
  const components = { pages: [] };
  const res = await addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: '404',
        type: 'Result',
        style: {
          minHeight: '100vh',
        },
        properties: {
          status: 404,
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
                      params: {
                        home: true,
                      },
                      type: 'Link',
                    },
                  ],
                },
                id: 'home',
                properties: {
                  icon: 'HomeOutlined',
                  title: 'Go to home page',
                  type: 'Link',
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

test('addDefaultPages, pages without 404 page', async () => {
  const components = { pages: [{ id: 'page1', type: 'PageHeaderMenu' }] };
  const res = await addDefaultPages({ components, context });
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
          status: 404,
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
                      params: {
                        home: true,
                      },
                      type: 'Link',
                    },
                  ],
                },
                id: 'home',
                properties: {
                  icon: 'HomeOutlined',
                  title: 'Go to home page',
                  type: 'Link',
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

test('addDefaultPages, pages with 404 page, should not overwrite', async () => {
  const components = {
    pages: [
      { id: 'page1', type: 'PageHeaderMenu' },
      { id: '404', type: 'PageHeaderMenu' },
    ],
  };
  const res = await addDefaultPages({ components, context });
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

test('addDefaultPages, pages not an array', async () => {
  const components = {
    pages: { id: 'page1', type: 'PageHeaderMenu' },
  };
  await expect(addDefaultPages({ components, context })).rejects.toThrow(
    'lowdefy.pages is not an array.'
  );
});

test('addDefaultPages, pages are copied', async () => {
  const components1 = {};
  const res1 = await addDefaultPages({ components: components1, context });
  const page1 = res1.pages[0];
  page1.id = 'page:404';
  const components2 = {};
  const res2 = await addDefaultPages({ components: components2, context });
  expect(res2.pages[0].id).toEqual('404');
});
