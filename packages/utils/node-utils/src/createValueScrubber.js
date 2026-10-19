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

import collectStringLeaves from './collectStringLeaves.js';

const REDACTED = '[REDACTED]';

// Shorter values, like `true` or a port number, would shred unrelated text.
const MIN_SECRET_LENGTH = 8;

// Authors JSON-encode structured secrets and pick a leaf with `_json.parse`, so the leaf, not
// the whole encoded string, is what ends up in an error message.
function parseJsonLeaves(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }
  if (!type.isObject(parsed) && !type.isArray(parsed)) {
    return [];
  }
  return collectStringLeaves(parsed);
}

// A secret embedded in a larger base64 payload (a Basic auth header built from
// `user:password`) only matches the secret's own base64 when both start on the same 3-byte
// boundary. Encoding at each offset and keeping only the characters whose 6 bits fall wholly
// inside the secret's bytes gives a fragment that matches whatever surrounds it.
function base64Fragments(value) {
  const bytes = Buffer.from(value, 'utf8');
  const fragments = [];
  [0, 1, 2].forEach((offset) => {
    const padded = Buffer.concat([Buffer.alloc(offset), bytes]);
    const start = Math.ceil((8 * offset) / 6);
    const end = Math.floor((8 * (offset + bytes.length)) / 6);
    ['base64', 'base64url'].forEach((encoding) => {
      fragments.push(padded.toString(encoding).replace(/=+$/, '').slice(start, end));
    });
  });
  return fragments;
}

function secretForms(value) {
  return [
    value,
    encodeURIComponent(value),
    JSON.stringify(value).slice(1, -1),
    ...base64Fragments(value),
  ];
}

function returnUnchanged(value) {
  return value;
}

// Returns a function that replaces each of the values, and the forms they take once encoded,
// with [REDACTED] in a string.
function createValueScrubber(values) {
  const expanded = values.flatMap((value) => [value, ...parseJsonLeaves(value)]);
  const secretValues = new Set(expanded.filter((value) => value.length >= MIN_SECRET_LENGTH));

  const forms = new Set();
  secretValues.forEach((value) => {
    secretForms(value).forEach((form) => {
      if (form.length > 0) forms.add(form);
    });
  });
  // No values means no pattern: an empty alternation would match at every position.
  if (forms.size === 0) {
    return returnUnchanged;
  }
  // One alternation, so every log line and Sentry string takes a single pass however many
  // values there are. Longest first, so a form is replaced whole before a shorter form it
  // contains can match at the same position.
  const pattern = new RegExp(
    [...forms]
      .sort((a, b) => b.length - a.length)
      .map((form) => form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|'),
    'g'
  );

  return function scrub(value) {
    if (!type.isString(value)) return value;
    return value.replace(pattern, REDACTED);
  };
}

export default createValueScrubber;
