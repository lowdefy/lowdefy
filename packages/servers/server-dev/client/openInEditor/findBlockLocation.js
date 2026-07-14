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

// Resolves a blockId to its YAML source via the dev server's existing
// GET /lowdefy-docs/find/{id}?pageId= route (which JIT-builds the page's
// keyMap on demand). Returns { file, line } with an absolute file path, or
// null when the id has no configured location. Best-effort, matching
// sendFeedback.js — a dev-only feature must never throw into the app.
async function findBlockLocation({ basePath, blockId, pageId }) {
  try {
    const response = await fetch(
      `${basePath}/lowdefy-docs/find/${encodeURIComponent(blockId)}` +
        `?pageId=${encodeURIComponent(pageId ?? '')}`
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const source = data.matches?.[0]?.location?.source;
    if (typeof source !== 'string' || source.length === 0) {
      return null;
    }
    // source is "<absolute path>" or "<absolute path>:<line>" — a numeric
    // suffix after the last colon is the 1-based line number. Splitting on
    // the last colon keeps Windows drive-letter colons intact.
    const match = source.match(/^(.*):(\d+)$/);
    if (match) {
      return { file: match[1], line: Number(match[2]) };
    }
    return { file: source, line: 1 };
  } catch {
    return null;
  }
}

export default findBlockLocation;
