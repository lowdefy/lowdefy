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

import { MAX_BYTES } from './limits.js';
import warnSkipped from './warnSkipped.js';

// Read a response body in chunks, stopping as soon as the cap is crossed rather
// than after the whole body has arrived.
async function readCapped({ body, src, logger }) {
  const chunks = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.length;
    if (total > MAX_BYTES) {
      warnSkipped({ logger, src, reason: `response exceeded the ${MAX_BYTES}-byte cap` });
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export default readCapped;
