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

import getCameraError from './getCameraError.js';

function domError(name, message = 'browser message') {
  const error = new Error(message);
  error.name = name;
  return error;
}

test('getCameraError explains a denied camera permission', () => {
  expect(getCameraError({ error: domError('NotAllowedError') })).toEqual({
    name: 'NotAllowedError',
    message: 'Camera permission was denied.',
  });
});

test('getCameraError explains a missing or busy camera', () => {
  expect(getCameraError({ error: domError('NotFoundError') }).message).toBe('No camera was found.');
  expect(getCameraError({ error: domError('NotReadableError') }).message).toBe(
    'The camera is in use by another app.'
  );
});

test('getCameraError keeps the message of an error it has no wording for', () => {
  expect(getCameraError({ error: domError('AbortError', 'Video play was interrupted.') })).toEqual({
    name: 'AbortError',
    message: 'Video play was interrupted.',
  });
});
