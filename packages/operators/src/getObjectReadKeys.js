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

import { applyArrayIndices } from '@lowdefy/helpers';

import isPlainObject from './isPlainObject.js';

function readKey({ arrayIndices, key, namespace }) {
  // applyArrayIndices only replaces '$', and copies arrayIndices to do it.
  const path =
    typeof key === 'string' && key.includes('$') ? applyArrayIndices(arrayIndices, key) : key;
  const pathString = String(path);
  if (pathString === '') return [`${namespace}:*`];
  return [`${namespace}:${pathString}`];
}

// The read keys of a getFromObject call. Mirrors getFromObject's params normalisation exactly, so
// the recorded key is the path the operator reads. Params the operator rejects fall back to the
// namespace wildcard: over-reporting a read costs an evaluation, under-reporting leaves a block stale.
// Runs for every recorded _state, _global, _input... call, so types are tested natively.
function getObjectReadKeys({ arrayIndices, namespace, params }) {
  if (typeof params === 'string' || Number.isInteger(params)) {
    return readKey({ arrayIndices, key: params, namespace });
  }
  if (!isPlainObject(params)) return [`${namespace}:*`];
  const { key } = params;
  if (key === null) return [];
  if (params.all === true) return [`${namespace}:*`];
  if (typeof key !== 'string' && !Number.isInteger(key)) return [`${namespace}:*`];
  return readKey({ arrayIndices, key, namespace });
}

export default getObjectReadKeys;
