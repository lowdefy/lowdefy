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

import resolveChain from './resolveChain.js';

const registry = {
  versions: [
    {
      version: '4.8.0',
      from: '>=4.0.0 <4.8.0',
      description: 'Antd v6 upgrade',
      codemods: [{ id: 'rename-areas', category: 'A', description: 'Rename areas to slots' }],
    },
    {
      version: '5.0.0',
      from: '>=4.8.0 <5.0.0',
      description: 'Dayjs migration',
      codemods: [{ id: 'rename-moment', category: 'A', description: 'Rename _moment to _dayjs' }],
    },
    {
      version: '6.0.0',
      from: '>=5.0.0 <6.0.0',
      description: 'Plugin types update',
      codemods: [
        { id: 'update-plugins', category: 'A', description: 'Update plugin declarations' },
      ],
    },
  ],
};

test('single phase upgrade', () => {
  const chain = resolveChain({
    registry,
    currentVersion: '4.5.0',
    targetVersion: '4.8.0',
  });
  expect(chain).toHaveLength(1);
  expect(chain[0].version).toBe('4.8.0');
});

test('multi-phase upgrade', () => {
  const chain = resolveChain({
    registry,
    currentVersion: '4.5.0',
    targetVersion: '6.0.0',
  });
  expect(chain).toHaveLength(3);
  expect(chain.map((e) => e.version)).toEqual(['4.8.0', '5.0.0', '6.0.0']);
});

test('already up to date returns empty', () => {
  const chain = resolveChain({
    registry,
    currentVersion: '6.0.0',
    targetVersion: '6.0.0',
  });
  expect(chain).toEqual([]);
});

test('ahead of target returns empty', () => {
  const chain = resolveChain({
    registry,
    currentVersion: '7.0.0',
    targetVersion: '6.0.0',
  });
  expect(chain).toEqual([]);
});

test('empty registry returns empty', () => {
  const chain = resolveChain({
    registry: { versions: [] },
    currentVersion: '4.0.0',
    targetVersion: '6.0.0',
  });
  expect(chain).toEqual([]);
});

test('gap handling — skips to next available entry', () => {
  const gapRegistry = {
    versions: [
      {
        version: '5.0.0',
        from: '>=4.9.0 <5.0.0',
        description: 'Phase 2',
        codemods: [],
      },
      {
        version: '6.0.0',
        from: '>=5.0.0 <6.0.0',
        description: 'Phase 3',
        codemods: [],
      },
    ],
  };
  // User is on 4.8.0, no entry covers 4.8.0→4.9.0. Should skip to 5.0.0.
  const chain = resolveChain({
    registry: gapRegistry,
    currentVersion: '4.8.0',
    targetVersion: '6.0.0',
  });
  expect(chain).toHaveLength(2);
  expect(chain.map((e) => e.version)).toEqual(['5.0.0', '6.0.0']);
});

test('partial upgrade stops at target', () => {
  const chain = resolveChain({
    registry,
    currentVersion: '4.5.0',
    targetVersion: '5.0.0',
  });
  expect(chain).toHaveLength(2);
  expect(chain.map((e) => e.version)).toEqual(['4.8.0', '5.0.0']);
});

test('no matching entries for range returns empty', () => {
  const chain = resolveChain({
    registry: {
      versions: [
        { version: '10.0.0', from: '>=9.0.0 <10.0.0', description: 'Future', codemods: [] },
      ],
    },
    currentVersion: '4.0.0',
    targetVersion: '5.0.0',
  });
  expect(chain).toEqual([]);
});
