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

import { type } from '@lowdefy/helpers';

import fetchRemoteImage from './fetchRemoteImage.js';
import readPublicAsset from './readPublicAsset.js';
import warnSkipped from './warnSkipped.js';

/**
 * A relative path (`/logo.png`) names a public asset. The server's copied
 * public/ folder is read first: it is on disk wherever the server runs, needs no
 * network, and cannot be redirected. Only when the file is not there is the
 * path fetched from the app origin, and that fetch runs under the full SSRF
 * guard: the origin is derived from the request's Host header, which the client
 * controls, so it earns no exemption.
 */
async function resolveRelativePath({ src, origin, publicDirectory, logger }) {
  if (type.isString(publicDirectory) && publicDirectory !== '') {
    const asset = await readPublicAsset({ src, publicDirectory, logger });
    if (asset.outcome === 'found') return asset.image;
    if (asset.outcome === 'refused') return null;
  }
  if (!type.isString(origin) || origin === '') {
    warnSkipped({
      logger,
      src,
      reason: 'not found in the public directory and no origin available to fetch it',
    });
    return null;
  }
  let url;
  try {
    url = new URL(src, origin);
  } catch {
    warnSkipped({ logger, src, reason: 'relative path could not be resolved against origin' });
    return null;
  }
  return fetchRemoteImage({ url, src, logger });
}

export default resolveRelativePath;
