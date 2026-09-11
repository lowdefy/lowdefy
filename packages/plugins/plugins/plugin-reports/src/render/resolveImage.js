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

/**
 * The one place image bytes are acquired for a report. Every image, the Img
 * block's and markdown's alike, routes through here so the acquisition rules and
 * the security guardrails live in one module. A resolver never throws: any
 * failure logs a warning and returns null, and the caller skips that image so
 * the report still renders.
 *
 * Three source kinds:
 *   - data: URIs decode directly (the mime must be image/*).
 *   - Relative paths (/logo.png) are read from the server's public directory,
 *     falling back to a guarded fetch from the app origin (resolveRelativePath).
 *   - Absolute http(s) URLs are fetched under the SSRF guard (fetchRemoteImage):
 *     the host must resolve only to public addresses, the connection is pinned
 *     to the checked addresses, redirects are refused, the request times out,
 *     the body is capped, and the content-type must be image/*.
 */

import { type } from '@lowdefy/helpers';

import fetchRemoteImage from './image/fetchRemoteImage.js';
import resolveDataUri from './image/resolveDataUri.js';
import resolveRelativePath from './image/resolveRelativePath.js';
import warnSkipped from './image/warnSkipped.js';

/**
 * @param {object} params
 * @param {string} params.src A data: URI, a relative public-asset path, or an
 *   absolute http(s) URL.
 * @param {string} [params.origin] The app's request origin, the last resort for
 *   a relative path that is not on disk.
 * @param {string} [params.publicDirectory] Absolute path of the server's public
 *   folder.
 * @param {object} [params.logger] Pino-style logger; a warning is logged on
 *   every failure.
 * @returns {Promise<{ buffer: Buffer, mime: string } | null>}
 */
async function resolveImage({ src, origin, publicDirectory, logger } = {}) {
  if (!type.isString(src) || src.trim() === '') {
    warnSkipped({ logger, src, reason: 'source is empty' });
    return null;
  }
  const trimmed = src.trim();
  if (trimmed.startsWith('data:')) {
    return resolveDataUri({ src: trimmed, logger });
  }
  if (/^https?:\/\//i.test(trimmed)) {
    let url;
    try {
      url = new URL(trimmed);
    } catch {
      warnSkipped({ logger, src, reason: 'invalid URL' });
      return null;
    }
    return fetchRemoteImage({ url, src: trimmed, logger });
  }
  return resolveRelativePath({ src: trimmed, origin, publicDirectory, logger });
}

export default resolveImage;
export { resolveImage };
