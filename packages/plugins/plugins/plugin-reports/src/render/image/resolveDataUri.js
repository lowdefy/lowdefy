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

// data:[<mediatype>][;base64],<data>
function resolveDataUri({ src, logger }) {
  const comma = src.indexOf(',');
  if (comma === -1) {
    warnSkipped({ logger, src, reason: 'malformed data URI' });
    return null;
  }
  const meta = src.slice(5, comma);
  const data = src.slice(comma + 1);
  const isBase64 = /;base64$/i.test(meta);
  const mime = (isBase64 ? meta.slice(0, -7) : meta).split(';')[0].trim().toLowerCase();
  if (!mime.startsWith('image/')) {
    warnSkipped({ logger, src, reason: `data URI mime '${mime || 'text/plain'}' is not an image` });
    return null;
  }
  try {
    const buffer = isBase64
      ? Buffer.from(data, 'base64')
      : Buffer.from(decodeURIComponent(data), 'utf8');
    if (buffer.length === 0) {
      warnSkipped({ logger, src, reason: 'data URI decoded to zero bytes' });
      return null;
    }
    if (buffer.length > MAX_BYTES) {
      warnSkipped({
        logger,
        src,
        reason: `data URI decoded to ${buffer.length} bytes, over the ${MAX_BYTES}-byte cap`,
      });
      return null;
    }
    return { buffer, mime };
  } catch {
    warnSkipped({ logger, src, reason: 'data URI failed to decode' });
    return null;
  }
}

export default resolveDataUri;
