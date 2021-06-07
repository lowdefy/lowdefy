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
        blocks: [
          {
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
            id: '404_result',
            properties: {
              status: 404,
              subTitle: 'Sorry, the page you are visiting does not exist.',
              title: '404',
            },
            type: 'Result',
          },
        ],
        id: '404',
        style: {
          minHeight: '100vh',
        },
        type: 'Context',
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
        blocks: [
          {
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
            id: '404_result',
            properties: {
              status: 404,
              subTitle: 'Sorry, the page you are visiting does not exist.',
              title: '404',
            },
            type: 'Result',
          },
        ],
        id: '404',
        style: {
          minHeight: '100vh',
        },
        type: 'Context',
      },
    ],
  });
});

test('addDefaultPages, pages without 404 page', async () => {
  const components = { pages: [{ id: 'page1', type: 'Context' }] };
  const res = await addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page1',
        type: 'Context',
      },
      {
        blocks: [
          {
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
            id: '404_result',
            properties: {
              status: 404,
              subTitle: 'Sorry, the page you are visiting does not exist.',
              title: '404',
            },
            type: 'Result',
          },
        ],
        id: '404',
        style: {
          minHeight: '100vh',
        },
        type: 'Context',
      },
    ],
  });
});

test('addDefaultPages, pages with 404 page, should not overwrite', async () => {
  const components = {
    pages: [
      { id: 'page1', type: 'Context' },
      { id: '404', type: 'Context' },
    ],
  };
  const res = await addDefaultPages({ components, context });
  expect(res).toEqual({
    pages: [
      {
        id: 'page1',
        type: 'Context',
      },
      {
        id: '404',
        type: 'Context',
      },
    ],
  });
});

test('addDefaultPages, pages not an ', async () => {
  const components = {
    pages: { id: 'page1', type: 'Context' },
  };
  await expect(addDefaultPages({ components, context })).rejects.toThrow(
    'lowdefy.pages is not an array.'
  );
});
