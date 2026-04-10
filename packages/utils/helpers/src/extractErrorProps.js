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

function isPlainObject(val) {
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

const MAX_CAUSE_DEPTH = 3;
const MAX_OBJECT_DEPTH = 5;

function cleanValue(val, seen, objectDepth, causeDepth) {
  if (objectDepth > MAX_OBJECT_DEPTH) return '[Truncated]';
  if (val === null || typeof val !== 'object') return val;
  if (seen.has(val)) return '[Circular]';
  seen.add(val);
  if (Array.isArray(val)) {
    return val.map((item) => cleanValue(item, seen, objectDepth + 1, causeDepth));
  }
  if (val instanceof Date) return val;
  if (val instanceof Error) return _extractErrorProps(val, seen, objectDepth, causeDepth);
  if (!isPlainObject(val)) return `[Object: ${val.constructor?.name ?? 'unknown'}]`;
  const cleaned = {};
  for (const [k, v] of Object.entries(val)) {
    const cv = cleanValue(v, seen, objectDepth + 1, causeDepth);
    if (cv !== undefined) cleaned[k] = cv;
  }
  return cleaned;
}

function _extractErrorProps(err, seen, objectDepth, causeDepth) {
  if (!err) return err;
  seen.add(err);
  const props = { message: err.message, name: err.name, stack: err.stack };
  if (err.cause !== undefined) {
    if (err.cause instanceof Error && !seen.has(err.cause) && causeDepth < MAX_CAUSE_DEPTH) {
      props.cause = _extractErrorProps(err.cause, seen, objectDepth, causeDepth + 1);
    } else if (!(err.cause instanceof Error)) {
      props.cause = cleanValue(err.cause, seen, objectDepth + 1, causeDepth);
    }
  }
  for (const key of Object.keys(err)) {
    if (key === 'cause') continue;
    const value = err[key];
    if (value === null || typeof value !== 'object') {
      props[key] = value;
    } else if (value instanceof Date) {
      props[key] = value;
    } else if (Array.isArray(value)) {
      props[key] = cleanValue(value, seen, objectDepth + 1, causeDepth);
    } else if (value instanceof Error) {
      if (!seen.has(value)) {
        props[key] = _extractErrorProps(value, seen, objectDepth, causeDepth);
      }
    } else if (isPlainObject(value)) {
      props[key] = cleanValue(value, seen, objectDepth + 1, causeDepth);
    }
    // Skip class instances (Socket, Agent, ClientRequest, etc.)
  }
  return props;
}

function extractErrorProps(err) {
  return _extractErrorProps(err, new Set(), 0, 0);
}

export default extractErrorProps;
