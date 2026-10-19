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

const MARKER_KEYS = new Set(['~k', '~r', '~l', '~ignoreBuildChecks']);

// A build artifact as config, without what the build adds to locate it: the
// ~k, ~r, ~l and ~ignoreBuildChecks markers go at every level, and
// { "~arr": [...] } becomes its array. Everything else stays, including _js
// function hashes, because a changed hash is changed code. So moving config
// within or between files changes no artifact whose content did not change.
function normaliseArtifact(value) {
  if (type.isString(value)) {
    return normaliseArtifact(JSON.parse(value));
  }
  return normaliseValue(value);
}

function normaliseValue(value) {
  if (type.isArray(value)) {
    return value.map(normaliseValue);
  }
  if (!type.isObject(value)) {
    return value;
  }
  if (type.isArray(value['~arr'])) {
    return normaliseValue(value['~arr']);
  }
  const normalised = {};
  Object.entries(value).forEach(([key, item]) => {
    if (MARKER_KEYS.has(key)) return;
    normalised[key] = normaliseValue(item);
  });
  return normalised;
}

export default normaliseArtifact;
