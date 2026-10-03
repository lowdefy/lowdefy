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

import errorRecordingStamp from './errorRecordingStamp.js';

test('errorRecordingStamp gives the source, run id and walk of a verified run cookie', () => {
  expect(
    errorRecordingStamp({
      source: 'explorer',
      run: { id: '20261003T151200Z-p0d4rm', by: 'explorer', journey: 'walk-3', actor: 'main' },
    })
  ).toEqual({ source: 'explorer', run: '20261003T151200Z-p0d4rm', journey: 'walk-3' });
});

test('errorRecordingStamp is null for a developer tab and a headless tool context', () => {
  expect(errorRecordingStamp(null)).toBeNull();
  expect(errorRecordingStamp('off')).toBeNull();
});
