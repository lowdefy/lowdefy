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

import createCopyError from './createCopyError.js';

// Yields the response body, refusing it as soon as it passes maxBytes or the Content-Length it
// declared. The last chunk is held back until the body has ended and its length checked, so a
// body that turns out longer or shorter than declared never completes the upload it feeds, and
// S3 stores nothing. Each refusal is passed to onRefuse before it is thrown, since the S3 client
// may report a failed body stream as an error of its own.
async function* limitBody({ body, declaredLength, maxBytes, onRefuse }) {
  function refuse(details) {
    const error = createCopyError(details);
    onRefuse(error);
    return error;
  }
  let size = 0;
  let held = null;
  for await (const chunk of body) {
    size += chunk.byteLength;
    if (size > maxBytes) {
      throw refuse({
        code: 'too_large',
        message: `AwsS3PutObject url content is larger than maxBytes (${maxBytes}).`,
      });
    }
    if (declaredLength !== null && size > declaredLength) {
      throw refuse({
        code: 'fetch_failed',
        message: `AwsS3PutObject url sent more than the ${declaredLength} bytes its Content-Length declared.`,
      });
    }
    if (held !== null) {
      yield held;
    }
    held = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }
  if (declaredLength !== null && size !== declaredLength) {
    throw refuse({
      code: 'fetch_failed',
      message: `AwsS3PutObject url sent ${size} of the ${declaredLength} bytes its Content-Length declared.`,
    });
  }
  if (held !== null) {
    yield held;
  }
}

export default limitBody;
