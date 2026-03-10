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

import YAML from 'yaml';

function isMarkerKey(key) {
  return typeof key === 'string' && key.length >= 2 && key[0] === '~';
}

function stripMarkers(value) {
  if (typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(stripMarkers);
  }
  if (value !== null && typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    const clean = {};
    for (const key of Object.keys(value)) {
      if (!isMarkerKey(key)) {
        const stripped = stripMarkers(value[key]);
        if (stripped !== undefined) {
          clean[key] = stripped;
        }
      }
    }
    return clean;
  }
  return value;
}

function custom_yaml_stringify({ params }) {
  let input;
  let options;
  if (Array.isArray(params)) {
    [input, options] = params;
  } else if (params !== null && typeof params === 'object' && 'on' in params) {
    input = params.on;
    options = params.options;
  } else {
    input = params;
  }
  if (input === undefined || input === null) return '';
  return YAML.stringify(stripMarkers(input), options);
}

export default custom_yaml_stringify;
