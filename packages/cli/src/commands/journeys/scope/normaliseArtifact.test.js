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

import normaliseArtifact from './normaliseArtifact.js';

test('normaliseArtifact strips build markers at every depth and unwraps ~arr', () => {
  const artifact = {
    id: 'page:tickets',
    '~k': 'a',
    '~r': '3',
    '~l': 12,
    '~ignoreBuildChecks': true,
    slots: {
      content: {
        blocks: {
          '~arr': [
            {
              blockId: 'title',
              properties: { html: { _js: 'f00d' }, '~k': 'c' },
              events: { onClick: { try: { '~arr': [{ id: 'go', '~k': 'e' }], '~k': 'f' } } },
              '~k': 'b',
            },
          ],
          '~k': 'd',
        },
      },
    },
  };
  expect(normaliseArtifact(artifact)).toEqual({
    id: 'page:tickets',
    slots: {
      content: {
        blocks: [
          {
            blockId: 'title',
            properties: { html: { _js: 'f00d' } },
            events: { onClick: { try: [{ id: 'go' }] } },
          },
        ],
      },
    },
  });
});

test('normaliseArtifact parses a JSON string and leaves plain values alone', () => {
  expect(normaliseArtifact('{"a":[1,"x",null,{"~k":"z","b":true}]}')).toEqual({
    a: [1, 'x', null, { b: true }],
  });
  expect(normaliseArtifact(null)).toBeNull();
});
