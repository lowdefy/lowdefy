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

import truncateResponse, { MAX_RESPONSE_CHARS } from './truncateResponse.js';

test('truncateResponse returns the result untouched when the response fits', () => {
  const result = { refused: false, response: [{ _id: 1 }], status: 'success' };

  expect(truncateResponse(result)).toBe(result);
});

test('truncateResponse keeps a null response untouched', () => {
  const result = { response: null, status: 'success' };

  expect(truncateResponse(result)).toBe(result);
});

test('truncateResponse slices an oversized response and flags it', () => {
  const big = 'x'.repeat(MAX_RESPONSE_CHARS + 500);
  const result = { response: big, status: 'success', error: null };

  const truncated = truncateResponse(result);

  expect(truncated).not.toBe(result);
  expect(truncated.truncated).toBe(true);
  expect(truncated.response).toHaveLength(MAX_RESPONSE_CHARS);
  expect(truncated.response.startsWith('"xxx')).toBe(true);
  expect(truncated.note).toBe(
    `Response truncated to ${MAX_RESPONSE_CHARS} characters (original serialized size: ${
      big.length + 2
    } characters).`
  );
  expect(truncated.status).toBe('success');
  expect(truncated.error).toBeNull();
  expect(result.truncated).toBeUndefined();
});
