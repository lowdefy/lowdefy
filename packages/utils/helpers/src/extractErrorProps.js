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

// `||`, not `??`: an anonymous class has the empty string as its constructor
// name, not undefined, and a marker whose only payload is the type name must
// not be emitted as '[Object: ]'.
function classInstanceMarker(val) {
  return `[Object: ${val.constructor?.name || 'unknown'}]`;
}

// A function is never passed through: `get` would hand a live closure over
// server state to app config. (serializer.copy only throws on a function at
// the top level; nested, it silently drops the key or turns it into null in
// an array - since this output is always an object, that vanished key, not a
// throw, was the real pre-fix failure.) Same empty-string fallback as
// classInstanceMarker - an anonymous function's `name` is '' rather than
// undefined.
function functionMarker(val) {
  return `[Function: ${val.name || 'unknown'}]`;
}

// A bigint's digits are its whole content, not internals, so the marker
// includes the value rather than just naming the type.
function bigintMarker(val) {
  return `[BigInt: ${val}]`;
}

// `.description` gives the bare description; `String(sym)` would wrap it as
// 'Symbol(description)', polluting the marker's payload. Same empty-string
// fallback as the other markers - a descriptionless symbol's `description` is
// undefined, and `Symbol('')`'s is '', so both must fall back to 'unknown'.
function symbolMarker(val) {
  return `[Symbol: ${val.description || 'unknown'}]`;
}

const MAX_CAUSE_DEPTH = 3;
const MAX_OBJECT_DEPTH = 5;

// Today's fields in today's order. The own `cause` key is skipped in the spread
// so an assigned (and therefore enumerable) cause is not listed twice.
function defaultProjection(err) {
  const props = { message: err.message, name: err.name, stack: err.stack, cause: err.cause };
  for (const key of Object.keys(err)) {
    if (key === 'cause') continue;
    props[key] = err[key];
  }
  return props;
}

function cleanValue(val, seen, objectDepth, causeDepth, project) {
  if (objectDepth > MAX_OBJECT_DEPTH) return '[Truncated]';
  if (typeof val === 'function') return functionMarker(val);
  if (typeof val === 'bigint') return bigintMarker(val);
  if (typeof val === 'symbol') return symbolMarker(val);
  if (val === null || typeof val !== 'object') return val;
  if (seen.has(val)) return '[Circular]';
  seen.add(val);
  if (Array.isArray(val)) {
    return val.map((item) => cleanValue(item, seen, objectDepth + 1, causeDepth, project));
  }
  if (val instanceof Date) return val;
  if (val instanceof Error) return _extractErrorProps(val, seen, objectDepth, causeDepth, project);
  if (!isPlainObject(val)) return classInstanceMarker(val);
  const cleaned = {};
  for (const [k, v] of Object.entries(val)) {
    const cv = cleanValue(v, seen, objectDepth + 1, causeDepth, project);
    if (cv !== undefined) cleaned[k] = cv;
  }
  return cleaned;
}

function cleanCause(cause, seen, objectDepth, causeDepth, project) {
  if (!(cause instanceof Error)) {
    return cleanValue(cause, seen, objectDepth + 1, causeDepth, project);
  }
  if (seen.has(cause)) return '[Circular]';
  if (causeDepth >= MAX_CAUSE_DEPTH) return '[Truncated]';
  return _extractErrorProps(cause, seen, objectDepth, causeDepth + 1, project);
}

function cleanPropValue(value, seen, objectDepth, causeDepth, project) {
  if (typeof value === 'function') return functionMarker(value);
  if (typeof value === 'bigint') return bigintMarker(value);
  if (typeof value === 'symbol') return symbolMarker(value);
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return cleanValue(value, seen, objectDepth + 1, causeDepth, project);
  if (value instanceof Error) {
    if (seen.has(value)) return '[Circular]';
    return _extractErrorProps(value, seen, objectDepth, causeDepth, project);
  }
  if (isPlainObject(value)) return cleanValue(value, seen, objectDepth + 1, causeDepth, project);
  // A class instance (Socket, Agent, ClientRequest, ...). Its internals are never exposed —
  // only the type name — but the key must not vanish: an absent key is indistinguishable
  // from "no such field", and this output is now read by `get` as app-visible config data.
  return classInstanceMarker(value);
}

function _extractErrorProps(err, seen, objectDepth, causeDepth, project) {
  if (!err) return err;
  seen.add(err);
  // Called at every error node rather than once for the walk, so a caller's
  // policy can key on the node itself - its class, or its own cause value.
  // Which fields an audience may see is the caller's decision, never this
  // walk's; this function only cleans the entries it is handed. An entry the
  // projection leaves out is never built, so a dropped cause is never
  // deep-copied and never marked in `seen`.
  const projected = (project ?? defaultProjection)(err);
  const props = {};
  for (const [key, value] of Object.entries(projected)) {
    if (value === undefined) continue;
    if (key === 'cause') {
      props.cause = cleanCause(value, seen, objectDepth, causeDepth, project);
    } else {
      props[key] = cleanPropValue(value, seen, objectDepth, causeDepth, project);
    }
  }
  return props;
}

// project: (err) => object - the props to emit for THIS error node, called once
// per node. Entries are cleaned as own properties are: Errors recurse through
// the same `project`, the returned `cause` is walked in place of the original,
// and `undefined` entries are dropped. Returning neither `message` nor `name` is
// legal but degrades the wire format rather than just trimming it: serializer's
// propsToError revives a cause as an Error only when it has a `message`, and
// looks the Lowdefy error class up by `name`. Leave either out and a round-trip
// yields plain objects.
function extractErrorProps(err, { project } = {}) {
  return _extractErrorProps(err, new Set(), 0, 0, project);
}

export default extractErrorProps;
