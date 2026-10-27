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

import { HTTPException } from 'hono/http-exception';

// Splits the rest of a catch-all route into decoded segments, independent of
// any configured basePath. Mirrors the Next.js [...param] query arrays —
// nested ids (slashes in pageId or endpointId) are real.
// A malformed percent escape (`%ZZ`, a bare `%`) is the caller's own URL, so it answers 400, not
// the 500 decodeURIComponent's URIError would raise.
function decodeSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch (error) {
    if (error instanceof URIError) {
      throw new HTTPException(400, { message: 'Malformed URL path.' });
    }
    throw error;
  }
}

function getPathSegments(c, prefix) {
  const rest = c.req.path.split(prefix)[1] ?? '';
  return rest.split('/').filter(Boolean).map(decodeSegment);
}

export default getPathSegments;
