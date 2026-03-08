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

import collectTailwindClasses, { walkBlocks } from './collectTailwindClasses.js';

test('collectTailwindClasses returns empty set when no pages', () => {
  const result = collectTailwindClasses({ components: {} });
  expect(result.size).toBe(0);
});

test('collectTailwindClasses returns empty set when pages have no class', () => {
  const result = collectTailwindClasses({
    components: {
      pages: [{ id: 'p1', type: 'Box' }],
    },
  });
  expect(result.size).toBe(0);
});

test('collectTailwindClasses collects string class value', () => {
  const result = collectTailwindClasses({
    components: {
      pages: [{ id: 'p1', type: 'Box', class: 'text-red-500' }],
    },
  });
  expect(result).toEqual(new Set(['text-red-500']));
});

test('collectTailwindClasses collects array class value', () => {
  const result = collectTailwindClasses({
    components: {
      pages: [{ id: 'p1', type: 'Box', class: ['p-4', 'mt-2'] }],
    },
  });
  expect(result).toEqual(new Set(['p-4', 'mt-2']));
});

test('collectTailwindClasses collects object class value recursively', () => {
  const result = collectTailwindClasses({
    components: {
      pages: [
        {
          id: 'p1',
          type: 'Box',
          class: { block: 'shadow-lg', element: 'font-bold' },
        },
      ],
    },
  });
  expect(result).toEqual(new Set(['shadow-lg', 'font-bold']));
});

test('collectTailwindClasses ignores non-string items in arrays', () => {
  const result = collectTailwindClasses({
    components: {
      pages: [{ id: 'p1', type: 'Box', class: ['p-4', 42, null, 'mt-2'] }],
    },
  });
  expect(result).toEqual(new Set(['p-4', 'mt-2']));
});

test('walkBlocks walks nested blocks', () => {
  const classes = new Set();
  walkBlocks(
    [
      {
        id: 'parent',
        type: 'Box',
        class: 'p-4',
        blocks: [{ id: 'child', type: 'Text', class: 'text-sm' }],
      },
    ],
    classes
  );
  expect(classes).toEqual(new Set(['p-4', 'text-sm']));
});

test('walkBlocks walks areas', () => {
  const classes = new Set();
  walkBlocks(
    [
      {
        id: 'parent',
        type: 'Box',
        class: 'p-4',
        areas: {
          content: {
            blocks: [{ id: 'child', type: 'Text', class: 'text-lg' }],
          },
        },
      },
    ],
    classes
  );
  expect(classes).toEqual(new Set(['p-4', 'text-lg']));
});

test('walkBlocks walks slots', () => {
  const classes = new Set();
  walkBlocks(
    [
      {
        id: 'parent',
        type: 'Box',
        slots: {
          header: {
            blocks: [{ id: 'h1', type: 'Title', class: 'font-bold' }],
          },
          content: {
            blocks: [{ id: 'c1', type: 'Text', class: 'text-base' }],
          },
        },
      },
    ],
    classes
  );
  expect(classes).toEqual(new Set(['font-bold', 'text-base']));
});

test('walkBlocks handles null/undefined blocks gracefully', () => {
  const classes = new Set();
  walkBlocks(null, classes);
  expect(classes.size).toBe(0);
  walkBlocks(undefined, classes);
  expect(classes.size).toBe(0);
});

test('walkBlocks skips blocks without class', () => {
  const classes = new Set();
  walkBlocks(
    [
      { id: 'a', type: 'Box' },
      { id: 'b', type: 'Box', class: 'mt-4' },
    ],
    classes
  );
  expect(classes).toEqual(new Set(['mt-4']));
});

test('collectTailwindClasses deduplicates classes across blocks', () => {
  const result = collectTailwindClasses({
    components: {
      pages: [
        { id: 'p1', type: 'Box', class: 'p-4' },
        { id: 'p2', type: 'Box', class: 'p-4' },
      ],
    },
  });
  expect(result).toEqual(new Set(['p-4']));
  expect(result.size).toBe(1);
});
