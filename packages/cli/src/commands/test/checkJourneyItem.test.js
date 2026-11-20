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

import { expect, test } from 'vitest';

import checkJourneyItem from './checkJourneyItem.js';

const journey = { name: 'saves', pageId: 'orders', steps: [{ click: 'save' }] };

test('checkJourneyItem lets a valid journey run', () => {
  expect(checkJourneyItem({ item: { filePath: 'a.yaml', journey } })).toBeUndefined();
});

test('checkJourneyItem refuses a journey with an unknown root key, naming the key', () => {
  const result = checkJourneyItem({
    item: { filePath: 'a.yaml', journey: { ...journey, seriel: true } },
  });
  expect(result).toMatchObject({
    name: 'saves',
    filePath: 'a.yaml',
    passed: false,
    refused: true,
    stepCount: 0,
  });
  expect(result.message).toContain('Invalid journey file: Journey has an unknown key "seriel".');
});
