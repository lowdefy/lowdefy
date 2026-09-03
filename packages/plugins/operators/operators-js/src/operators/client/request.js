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

import { ReservedKeyError, applyArrayIndices, get, serializer, type } from '@lowdefy/helpers';

// The engine keeps one entry per call, newest first (engine/Requests.js), and
// only creates an entry once the request has been called. So "no entry" is the
// never-called state, and it is neither loading, failed, nor successful — the
// distinction the value form collapses into a single null.
//
// `empty` is the form author's "no value" — null, undefined, '' and [] — the
// same rule _type: empty uses. An empty response is a *successful* request:
// "empty is not failed" is the whole reason this form exists.
function readStatus(entry) {
  if (type.isNone(entry)) {
    return { loading: false, error: null, success: false, empty: false };
  }
  const loading = entry.loading === true;
  const error = type.isNone(entry.error) ? null : entry.error.message ?? `${entry.error}`;
  const success = !loading && type.isNone(error);
  const response = entry.response;
  const empty =
    success &&
    (type.isNone(response) || response === '' || (type.isArray(response) && response.length === 0));
  return { loading, error, success, empty };
}

function readKey({ params }) {
  if (type.isString(params)) {
    return { key: params, status: false };
  }
  if (!type.isObject(params)) {
    throw new Error(
      `_request accepts a string value, or an object with a "key" string and an optional "status" boolean.`
    );
  }
  if (!type.isString(params.key)) {
    throw new Error(`_request object params require a "key" string naming the request.`);
  }
  if (!type.isNone(params.status) && !type.isBoolean(params.status)) {
    throw new Error(`_request "status" must be a boolean.`);
  }
  return { key: params.key, status: params.status === true };
}

function _request({ arrayIndices, params, requests }) {
  const { key, status } = readKey({ params });
  const splitKey = key.split('.');
  const [requestId, ...keyParts] = splitKey;
  const entry = requests[requestId]?.[0];
  if (status) {
    return readStatus(entry);
  }
  if (entry && (!entry.loading || entry.holdValue)) {
    if (splitKey.length === 1) {
      return serializer.copy(entry.response);
    }
    const path = keyParts.reduce((acc, value) => (acc === '' ? value : acc.concat('.', value)), '');
    try {
      return get(entry.response, applyArrayIndices(arrayIndices, path), {
        copy: true,
        default: null,
      });
    } catch (error) {
      // A runtime read: the key comes from app data or an author keypath evaluated at render time,
      // and there is no config location to attach in the browser. The reserved rule's job — refusing
      // the read — is already done, so degrade to the miss value rather than crashing the page.
      if (error instanceof ReservedKeyError) return null;
      throw error;
    }
  }
  return null;
}

_request.dynamic = true;

export default _request;
