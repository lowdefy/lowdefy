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

import { fetch } from 'undici';

import createPinnedDispatcher from './createPinnedDispatcher.js';
import { FETCH_TIMEOUT_MS, MAX_BYTES } from './limits.js';
import readCapped from './readCapped.js';
import resolveHostAddresses from './resolveHostAddresses.js';
import warnSkipped from './warnSkipped.js';

/**
 * Fetch an http(s) URL under the report guardrails: the host must resolve only
 * to public addresses and the connection is pinned to those addresses; redirects
 * are refused rather than followed (a redirect target would need the same
 * checks); the request times out; the body is capped; the content-type must be
 * an image.
 */
async function fetchRemoteImage({ url, src, logger }) {
  const addresses = await resolveHostAddresses(url.hostname);
  if (addresses === null) {
    warnSkipped({
      logger,
      src,
      reason: 'host resolves to a private, loopback, or link-local address',
    });
    return null;
  }

  const dispatcher = createPinnedDispatcher(addresses);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      dispatcher,
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.ok) {
      warnSkipped({ logger, src, reason: `fetch returned HTTP ${response.status}` });
      return null;
    }
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      warnSkipped({
        logger,
        src,
        reason: `content-type '${contentType || 'unknown'}' is not an image`,
      });
      return null;
    }
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BYTES) {
      warnSkipped({
        logger,
        src,
        reason: `declared content-length ${declared} exceeds the ${MAX_BYTES}-byte cap`,
      });
      return null;
    }
    if (!response.body) {
      warnSkipped({ logger, src, reason: 'response had no body' });
      return null;
    }
    const buffer = await readCapped({ body: response.body, src, logger });
    if (buffer === null) return null;
    return { buffer, mime: contentType.split(';')[0].trim() };
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'request timed out' : 'fetch failed';
    warnSkipped({ logger, src, reason });
    return null;
  } finally {
    clearTimeout(timer);
    await dispatcher.close();
  }
}

export default fetchRemoteImage;
