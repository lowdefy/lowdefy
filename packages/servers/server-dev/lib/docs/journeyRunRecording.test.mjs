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

import { isTraceId } from '@lowdefy/helpers';

import journeyRunRecording from './journeyRunRecording.js';

test('journeyRunRecording keeps the recording a caller passes', () => {
  const recording = {
    source: 'journey',
    run: { id: '20261003T151200Z-p0d4rm', by: 'test', journey: 'a' },
  };
  expect(journeyRunRecording({ recording, by: 'tool' })).toBe(recording);
});

test('journeyRunRecording gives a run with no recording a fresh identity that records nothing', () => {
  const first = journeyRunRecording({ by: 'test' });
  const second = journeyRunRecording({ by: 'test' });
  expect(first).toEqual({
    source: 'journey',
    run: { id: expect.any(String), by: 'test', journey: null },
    record: false,
  });
  expect(isTraceId(first.run.id)).toBe(true);
  expect(second.run.id).not.toEqual(first.run.id);
});
