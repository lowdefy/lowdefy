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

import cleanBuildArtifact from './cleanBuildArtifact.js';

test('cleanBuildArtifact strips ~k markers and unwraps ~arr into a plain array', () => {
  const artifact = {
    '~k': 'k1',
    type: 'object',
    required: { '~arr': ['a'], '~k': 'k2' },
    properties: { '~k': 'k3', a: { '~k': 'k4', type: 'string' } },
  };
  expect(cleanBuildArtifact(artifact)).toEqual({
    type: 'object',
    required: ['a'],
    properties: { a: { type: 'string' } },
  });
});

test('cleanBuildArtifact returns a new object and leaves the artifact untouched', () => {
  const artifact = { '~k': 'k1', type: 'object' };
  const cleaned = cleanBuildArtifact(artifact);
  expect(cleaned).not.toBe(artifact);
  expect(artifact['~k']).toEqual('k1');
});
