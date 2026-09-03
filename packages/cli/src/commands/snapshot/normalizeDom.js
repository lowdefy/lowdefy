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

// ISO-8601 timestamps rendered from dates that move (created_at, now).
const TIMESTAMP_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g;

// UUIDs (generated ids, request ids echoed into the DOM or held in state).
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

// Ordered replacements, applied before the DOM is compared. Each one removes a
// value that legitimately differs between two renders of unchanged config, so
// a golden DOM only changes when the page's own markup changes.
const REPLACEMENTS = [
  // antd's emotion hash class, dev (`css-dev-only-do-not-override-1a2b3c`) and
  // prod (`css-1a2b3c`) forms. `css-var` and friends are shorter than 5 chars
  // after the dash and are left alone.
  { pattern: /\bcss-(?:dev-only-do-not-override-)?[a-z0-9]{5,}\b/g, replacement: 'css-[HASH]' },
  // antd's CSS-variables hash id, e.g. `css-var-r0`.
  { pattern: /\bcss-var-r\d+\b/g, replacement: 'css-var-[HASH]' },
  // rc-menu ids carry a numeric uuid per mount: `rc-menu-uuid-49081-settings`.
  // Only the number is volatile — the trailing eventKey is the menu item's own
  // id (content a golden must keep), so the match stops at the uuid. It runs
  // before the general rc rule below, which would otherwise eat `rc-menu-uuid`.
  { pattern: /\brc-menu-uuid-\d+/g, replacement: 'rc-menu-uuid-[UUID]' },
  // rc-* per-mount ids and the aria attributes that point at them. The name
  // between the `rc` prefix and the mount counter may itself be several
  // segments (`rc-picker-panel-3`) or camelCase (`rc_virtualList_2`), so it is
  // matched as a whole rather than as a single lower-case word.
  { pattern: /\brc[_-]([a-zA-Z]+(?:[_-][a-zA-Z]+)*)[_-]\d+/g, replacement: 'rc-$1-[N]' },
  // React's useId output, e.g. `:r0:` / `«r0»`, used by some antd inputs.
  { pattern: /(?::|«)r[0-9a-z]+(?::|»)/g, replacement: '[RID]' },
  { pattern: TIMESTAMP_PATTERN, replacement: '[TS]' },
  { pattern: UUID_PATTERN, replacement: '[UUID]' },
];

// normalizeDom turns a page's outerHTML into the text that is committed as
// dom.html and diffed on --check: generated ids and hashes replaced, whitespace
// collapsed, one tag per line so a diff points at the element that changed.
// Placeholders use square brackets so they are never mistaken for a tag by
// the line split below.
function normalizeDom({ dom }) {
  let html = dom;
  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    html = html.replace(pattern, replacement);
  });
  html = html.replace(/\s+/g, ' ');
  // A newline between adjacent tags puts every element on its own line while
  // keeping an element's text content on the same line as its opening tag.
  html = html.replace(/>\s*</g, '>\n<');
  return html
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n');
}

export { TIMESTAMP_PATTERN, UUID_PATTERN };
export default normalizeDom;
