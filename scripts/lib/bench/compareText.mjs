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

import diffJson from './diffJson.mjs';
import diffText from './diffText.mjs';

const MAX_VALUE_LENGTH = 120;

function formatValue(value) {
  if (value === undefined) {
    return '(missing)';
  }
  const text = JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text;
}

function parseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

// Compares two texts, each side's server directory already replaced. A JSON
// file that differs is reported as its first 20 differing paths with both
// values; any other text as the start of a unified diff. Resolves to
// { identical, lines }.
function compareText({ file, baseline, current }) {
  if (baseline === current) {
    return { identical: true, lines: [] };
  }
  if (file.endsWith('.json')) {
    const left = parseJson(baseline);
    const right = parseJson(current);
    if (left.ok && right.ok) {
      const differences = diffJson({ baseline: left.value, current: right.value, limit: 20 });
      if (differences.length === 0) {
        return {
          identical: false,
          lines: [
            'Same JSON values in different bytes (key order or formatting).',
            ...diffText({ baseline, current, label: file }),
          ],
        };
      }
      return {
        identical: false,
        lines: differences.map(
          ({ path, baseline: before, current: after }) =>
            `${path === '' ? '(root)' : path}: ${formatValue(before)} → ${formatValue(after)}`
        ),
      };
    }
  }
  return { identical: false, lines: diffText({ baseline, current, label: file }) };
}

export default compareText;
