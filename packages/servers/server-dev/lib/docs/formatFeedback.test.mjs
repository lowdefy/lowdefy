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

import { jest } from '@jest/globals';

const mockFindConfig = jest.fn();
jest.unstable_mockModule('./findConfig.js', () => ({
  default: mockFindConfig,
}));

const { default: enrichFeedback } = await import('./enrichFeedback.js');
const { default: formatFeedback } = await import('./formatFeedback.js');

beforeEach(() => {
  mockFindConfig.mockReset();
});

// --- enrichFeedback ---

test('enrichFeedback attaches a location to annotations with a target blockId', async () => {
  mockFindConfig.mockResolvedValue({
    matches: [
      {
        keyPath: 'root.pages[0:login].blocks[2:submit_button:Button]',
        location: {
          source: 'pages/login.yaml:12',
          config: 'root.pages[0:login].blocks[2:submit_button:Button]',
        },
      },
    ],
  });
  const batch = {
    pageId: 'login',
    annotations: [
      {
        id: '1',
        kind: 'element',
        comment: 'too small',
        target: {
          blockId: 'submit_button',
          ancestorBlockIds: ['submit_button', 'login_form'],
          tag: 'BUTTON',
          text: 'Submit',
        },
        geometry: { elementRect: { x: 220, y: 480, width: 96, height: 40 }, shapes: [] },
      },
    ],
  };

  const enriched = await enrichFeedback({ batch });

  expect(mockFindConfig).toHaveBeenCalledWith({ id: 'submit_button', pageId: 'login' });
  expect(enriched.annotations[0].location).toEqual({
    source: 'pages/login.yaml:12',
    config: 'root.pages[0:login].blocks[2:submit_button:Button]',
  });
});

test('enrichFeedback attaches a note when findConfig finds no matches', async () => {
  mockFindConfig.mockResolvedValue({
    matches: [],
    note: 'No config found with id "missing" on page "login".',
  });
  const batch = {
    pageId: 'login',
    annotations: [{ id: '1', kind: 'element', comment: 'x', target: { blockId: 'missing' } }],
  };

  const enriched = await enrichFeedback({ batch });

  expect(enriched.annotations[0].location).toEqual({
    note: 'No config found with id "missing" on page "login".',
  });
});

test('enrichFeedback leaves annotations without a target blockId unchanged', async () => {
  const batch = {
    pageId: 'login',
    annotations: [{ id: '1', kind: 'region', comment: 'x', target: null }],
  };

  const enriched = await enrichFeedback({ batch });

  expect(mockFindConfig).not.toHaveBeenCalled();
  expect(enriched.annotations[0]).toEqual({ id: '1', kind: 'region', comment: 'x', target: null });
});

test('enrichFeedback still returns the batch when findConfig throws', async () => {
  mockFindConfig.mockRejectedValue(new Error('boom'));
  const batch = {
    pageId: 'login',
    annotations: [{ id: '1', kind: 'element', comment: 'x', target: { blockId: 'submit_button' } }],
  };

  const enriched = await enrichFeedback({ batch });

  expect(enriched.annotations).toHaveLength(1);
  expect(enriched.annotations[0].location.note).toMatch(/Failed to resolve location: boom/);
});

// --- formatFeedback ---

test('formatFeedback returns a message when there is no pending feedback', () => {
  expect(formatFeedback({ items: [] })).toMatch(/No pending feedback/);
});

test('formatFeedback formats an element annotation with location, ancestors, comment, shapes, and console', () => {
  const items = [
    {
      pageId: 'login',
      url: '/login?x=1',
      viewport: { width: 1280, height: 720, scrollX: 0, scrollY: 340, dpr: 2 },
      annotations: [
        {
          id: '1',
          kind: 'element',
          comment: 'Button is too small on mobile',
          target: {
            blockId: 'submit_button',
            ancestorBlockIds: ['submit_button', 'login_form'],
            tag: 'BUTTON',
            text: 'Submit',
          },
          geometry: {
            elementRect: { x: 220, y: 480, width: 96, height: 40 },
            shapes: [
              { type: 'rect', points: [] },
              { type: 'arrow', points: [] },
            ],
          },
          location: {
            source: 'pages/login.yaml:12',
            config: 'root.pages[0:login].blocks[2:submit_button:Button]',
          },
        },
      ],
      console: [
        {
          level: 'error',
          text: 'TypeError: x is not a function',
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  ];

  const text = formatFeedback({ items });

  expect(text).toContain('1 annotation(s) on page "login"');
  expect(text).toContain('viewport 1280x720 @2x, scrollY 340');
  expect(text).toContain('Element "submit_button" (pages/login.yaml:12)');
  expect(text).toContain('Ancestors: submit_button > login_form');
  expect(text).toContain('Comment: Button is too small on mobile');
  expect(text).toContain('1 rect around the element, 1 arrow');
  expect(text).toContain('ERROR: TypeError: x is not a function');
  expect(text).toContain('lowdefy_inspect_state({ pageId: "login" })');
  expect(text).toContain('lowdefy_screenshot_page');
});

test('formatFeedback formats a region annotation without a target', () => {
  const items = [
    {
      pageId: 'home',
      url: '/home',
      viewport: { width: 1280, height: 720 },
      annotations: [
        {
          id: '1',
          kind: 'region',
          comment: 'Layout looks off here',
          target: null,
          geometry: { elementRect: null, shapes: [{ type: 'freehand', points: [] }] },
        },
      ],
    },
  ];

  const text = formatFeedback({ items });

  expect(text).toContain('1. Region');
  expect(text).toContain('Comment: Layout looks off here');
  expect(text).toContain('1 freehand');
});

test('formatFeedback multiple batches are joined and each keeps its own pageId in instructions', () => {
  const items = [
    { pageId: 'login', url: '/login', viewport: { width: 100, height: 100 }, annotations: [] },
    { pageId: 'home', url: '/home', viewport: { width: 100, height: 100 }, annotations: [] },
  ];

  const text = formatFeedback({ items });

  expect(text).toContain('page "login"');
  expect(text).toContain('page "home"');
  expect(text).toContain('lowdefy_inspect_state({ pageId: "login" })');
  expect(text).toContain('lowdefy_inspect_state({ pageId: "home" })');
});
