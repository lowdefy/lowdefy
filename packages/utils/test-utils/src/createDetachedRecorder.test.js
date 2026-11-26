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
import { serializer } from '@lowdefy/helpers';

import createDetachedRecorder from './createDetachedRecorder.js';

const testApp = { modules: { helpers: { serializer } } };

test('sendDetached records the endpoint id and a copy of the payload, and runs nothing', () => {
  const detached = [];
  const sendDetached = createDetachedRecorder({ detached, testApp });
  const at = new Date('2026-11-18T10:00:00Z');
  const payload = { at, items: [1, 2] };
  sendDetached({}, { endpointId: 'detached_log', payload });
  payload.items.push(3);
  expect(detached).toEqual([{ endpointId: 'detached_log', payload: { at, items: [1, 2] } }]);
  expect(detached[0].payload.at).toBeInstanceOf(Date);
});
