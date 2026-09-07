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

import parseUserParam from './parseUserParam.js';
import screenshotPage from '../../../lib/docs/screenshotPage.js';

// Parses a query param as a number, or undefined if absent/not a valid
// number — undefined (not NaN/0) so callers can tell "not provided" apart
// from an explicit 0.
function queryNumber(c, key) {
  const raw = c.req.query(key);
  if (type.isNone(raw)) {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

async function docsScreenshotHandler(c) {
  const pageId = c.req.param('pageId');
  const fullPage = c.req.query('fullPage') === 'true';
  // Derived from the incoming request rather than a config value — this is
  // the origin an agent can actually reach the dev server on (host/port it
  // just connected to), regardless of how the server is bound.
  const origin = new URL(c.req.url).origin;

  const clipX = queryNumber(c, 'x');
  const clipY = queryNumber(c, 'y');
  const clipWidth = queryNumber(c, 'width');
  const clipHeight = queryNumber(c, 'height');
  // Only build a clip when all four dimensions are present — a partial
  // clip is ambiguous, so screenshotPage falls back to a normal viewport
  // screenshot in that case (same as an invalid clip).
  const clip =
    !type.isNone(clipX) &&
    !type.isNone(clipY) &&
    !type.isNone(clipWidth) &&
    !type.isNone(clipHeight)
      ? { x: clipX, y: clipY, width: clipWidth, height: clipHeight }
      : undefined;
  const scrollX = queryNumber(c, 'scrollX') ?? 0;
  const scrollY = queryNumber(c, 'scrollY') ?? 0;

  const { user, error: userError } = parseUserParam({ value: c.req.query('user') });
  if (userError) {
    return c.json({ error: userError }, 400);
  }

  const result = await screenshotPage({ origin, pageId, fullPage, clip, scrollX, scrollY, user });
  if (result.error) {
    return c.json({ error: result.error }, 502);
  }
  const buffer = Buffer.from(result.data, 'base64');
  return c.body(buffer, 200, { 'Content-Type': result.mimeType });
}

export default docsScreenshotHandler;
