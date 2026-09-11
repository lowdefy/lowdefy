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

import fs from 'node:fs/promises';
import path from 'node:path';

import imageMimeOf from './imageMimeOf.js';
import { MAX_BYTES } from './limits.js';
import warnSkipped from './warnSkipped.js';

/**
 * Read a relative image path from the server's public directory.
 *
 * Returns `{ outcome: 'found', image }` with the bytes, `{ outcome: 'missing' }`
 * when no such file exists (the caller may try the network), or
 * `{ outcome: 'refused' }` when the path must not be served at all: it escapes
 * the public directory, is not an image, or is over the size cap. A refused path
 * never falls through to a fetch, because the same path at the app origin would
 * name the same thing.
 */
async function readPublicAsset({ src, publicDirectory, logger }) {
  let relativePath;
  try {
    relativePath = decodeURIComponent(src.split(/[?#]/)[0]);
  } catch {
    warnSkipped({ logger, src, reason: 'relative path is not valid percent-encoding' });
    return { outcome: 'refused' };
  }
  const root = path.resolve(publicDirectory);
  const filePath = path.resolve(root, relativePath.replace(/^\/+/, ''));
  if (!filePath.startsWith(root + path.sep)) {
    warnSkipped({ logger, src, reason: 'relative path escapes the public directory' });
    return { outcome: 'refused' };
  }

  const mime = imageMimeOf(filePath);
  if (mime === undefined) {
    warnSkipped({ logger, src, reason: 'relative path does not name an image file' });
    return { outcome: 'refused' };
  }

  let stats;
  try {
    stats = await fs.stat(filePath);
  } catch {
    return { outcome: 'missing' };
  }
  if (!stats.isFile()) {
    return { outcome: 'missing' };
  }
  if (stats.size > MAX_BYTES) {
    warnSkipped({
      logger,
      src,
      reason: `public asset is ${stats.size} bytes, over the ${MAX_BYTES}-byte cap`,
    });
    return { outcome: 'refused' };
  }
  const buffer = await fs.readFile(filePath);
  return { outcome: 'found', image: { buffer, mime } };
}

export default readPublicAsset;
