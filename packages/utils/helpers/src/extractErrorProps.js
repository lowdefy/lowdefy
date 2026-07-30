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

const NO_OMIT = [];

function cleanValue(val, seen, objectDepth, causeDepth, omit) {
  if (objectDepth > MAX_OBJECT_DEPTH) return '[Truncated]';
  if (val === null || typeof val !== 'object') return val;
  if (seen.has(val)) return '[Circular]';
  seen.add(val);
  if (Array.isArray(val)) {
    return val.map((item) => cleanValue(item, seen, objectDepth + 1, causeDepth, omit));
  }
  if (val instanceof Date) return val;
  if (val instanceof Error) return _extractErrorProps(val, seen, objectDepth, causeDepth, omit);
  if (!isPlainObject(val)) return `[Object: ${val.constructor?.name ?? 'unknown'}]`;
  const cleaned = {};
  for (const [k, v] of Object.entries(val)) {
    const cv = cleanValue(v, seen, objectDepth + 1, causeDepth, omit);
    if (cv !== undefined) cleaned[k] = cv;
  }
  return cleaned;
}

function _extractErrorProps(err, seen, objectDepth, causeDepth, omit) {
  if (!err) return err;
  seen.add(err);
  // Called at every error node rather than once for the walk, so a caller's
  // policy can key on the node itself - its class, or its own cause value.
  // Which fields an audience may see is the caller's decision, never this
  // walk's; this function only applies the keys it is handed. Omitted fields
  // are skipped before they are built, so a dropped cause is never deep-copied
  // and never marked in `seen`.
  const omitted = omit?.(err) ?? NO_OMIT;
  const props = {};
  if (!omitted.includes('message')) props.message = err.message;
  if (!omitted.includes('name')) props.name = err.name;
  if (!omitted.includes('stack')) props.stack = err.stack;
  if (err.cause !== undefined && !omitted.includes('cause')) {
    if (err.cause instanceof Error && !seen.has(err.cause) && causeDepth < MAX_CAUSE_DEPTH) {
      props.cause = _extractErrorProps(err.cause, seen, objectDepth, causeDepth + 1, omit);
    } else if (!(err.cause instanceof Error)) {
      props.cause = cleanValue(err.cause, seen, objectDepth + 1, causeDepth, omit);
    }
  }
  for (const key of Object.keys(err)) {
    if (key === 'cause' || omitted.includes(key)) continue;
    const value = err[key];
    if (value === null || typeof value !== 'object') {
      props[key] = value;
    } else if (value instanceof Date) {
      props[key] = value;
    } else if (Array.isArray(value)) {
      props[key] = cleanValue(value, seen, objectDepth + 1, causeDepth, omit);
    } else if (value instanceof Error) {
      if (!seen.has(value)) {
        props[key] = _extractErrorProps(value, seen, objectDepth, causeDepth, omit);
      }
    } else if (isPlainObject(value)) {
      props[key] = cleanValue(value, seen, objectDepth + 1, causeDepth, omit);
    }
    // Skip class instances (Socket, Agent, ClientRequest, etc.)
  }
  return props;
}

// omit: (err) => string[] - the field names to leave off THIS error node, called
// once per node. Returning 'message' or 'name' is legal but degrades the wire
// format rather than just trimming it: serializer's propsToError revives a cause
// as an Error only when it has a `message`, and looks the Lowdefy error class up
// by `name`. Omit either and a round-trip yields plain objects.
function extractErrorProps(err, { omit } = {}) {
  return _extractErrorProps(err, new Set(), 0, 0, omit);
}

export default extractErrorProps;
