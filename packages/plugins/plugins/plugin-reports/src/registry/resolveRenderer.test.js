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

import resolveRenderer from './resolveRenderer.js';

test('returns an empty registry when blocksStatic is absent', () => {
  expect(resolveRenderer()).toEqual({});
  expect(resolveRenderer({})).toEqual({});
  expect(resolveRenderer({ blocksStatic: undefined })).toEqual({});
  expect(resolveRenderer({ blocksStatic: null })).toEqual({});
});

test('passes through entries that expose a toReport function', () => {
  const title = { toReport: () => ({ kind: 'heading' }) };
  const paragraph = { toReport: () => ({ kind: 'text' }) };
  const registry = resolveRenderer({ blocksStatic: { Title: title, Paragraph: paragraph } });
  expect(registry).toEqual({ Title: title, Paragraph: paragraph });
});

test('drops entries without a toReport function', () => {
  const good = { toReport: () => ({}) };
  const registry = resolveRenderer({
    blocksStatic: {
      Good: good,
      NoToReport: { render: () => ({}) },
      NotAnObject: 'nope',
      Nullish: null,
    },
  });
  expect(registry).toEqual({ Good: good });
});
