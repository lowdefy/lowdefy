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

const REDACTED = '[REDACTED]';

// Shorter values, like `true` or a port number, would shred unrelated text.
const MIN_SECRET_LENGTH = 8;

function collectStringLeaves(value, leaves) {
  if (type.isString(value)) {
    leaves.push(value);
    return leaves;
  }
  if (type.isArray(value)) {
    value.forEach((item) => collectStringLeaves(item, leaves));
    return leaves;
  }
  if (type.isObject(value)) {
    Object.values(value).forEach((item) => collectStringLeaves(item, leaves));
  }
  return leaves;
}

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
  return collectStringLeaves(parsed, []);
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

function createSecretScrubber({ secrets, env = process.env }) {
  const values = collectStringLeaves(secrets, []);
  if (!type.isNone(env.CRON_SECRET)) values.push(env.CRON_SECRET);
  if (!type.isNone(env.AUTH_SECRET)) values.push(env.AUTH_SECRET);

  const expanded = values.flatMap((value) => [value, ...parseJsonLeaves(value)]);
  const secretValues = new Set(expanded.filter((value) => value.length >= MIN_SECRET_LENGTH));

  const forms = new Set();
  secretValues.forEach((value) => {
    secretForms(value).forEach((form) => {
      if (form.length > 0) forms.add(form);
    });
  });
  // Longest first, so a form is replaced whole before a shorter form it contains can break it up.
  const sortedForms = [...forms].sort((a, b) => b.length - a.length);

  return function scrub(value) {
    if (!type.isString(value)) return value;
    return sortedForms.reduce((text, form) => text.split(form).join(REDACTED), value);
  };
}

export default createSecretScrubber;
