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

import buildPrepareStep from './buildPrepareStep.js';

test('returns undefined when no rules provided', () => {
  expect(buildPrepareStep(undefined)).toBeUndefined();
  expect(buildPrepareStep([])).toBeUndefined();
});

test('returns matching rule config for step number', async () => {
  const prepareStep = buildPrepareStep([
    { steps: [1, 2], activeTools: ['search'], toolChoice: 'required' },
    { steps: [3], activeTools: ['summarize'] },
  ]);

  const result1 = await prepareStep({ stepNumber: 1 });
  expect(result1).toEqual({ activeTools: ['search'], toolChoice: 'required' });

  const result2 = await prepareStep({ stepNumber: 3 });
  expect(result2).toEqual({ activeTools: ['summarize'] });
});

test('returns empty object when no rule matches', async () => {
  const prepareStep = buildPrepareStep([{ steps: [1], activeTools: ['search'] }]);

  const result = await prepareStep({ stepNumber: 5 });
  expect(result).toEqual({});
});

test('supports step ranges with from/to', async () => {
  const prepareStep = buildPrepareStep([
    { from: 1, to: 3, activeTools: ['search'] },
    { from: 4, toolChoice: 'auto' },
  ]);

  const result1 = await prepareStep({ stepNumber: 2 });
  expect(result1).toEqual({ activeTools: ['search'] });

  const result4 = await prepareStep({ stepNumber: 4 });
  expect(result4).toEqual({ toolChoice: 'auto' });

  const result10 = await prepareStep({ stepNumber: 10 });
  expect(result10).toEqual({ toolChoice: 'auto' });
});

test('first matching rule wins', async () => {
  const prepareStep = buildPrepareStep([
    { steps: [1], activeTools: ['a'] },
    { steps: [1], activeTools: ['b'] },
  ]);

  const result = await prepareStep({ stepNumber: 1 });
  expect(result).toEqual({ activeTools: ['a'] });
});
