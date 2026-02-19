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

function _extractErrorProps(err, seen, depth) {
  if (!err) return err;
  seen.add(err);
  const props = { message: err.message, name: err.name, stack: err.stack };
  if (err.cause !== undefined) {
    if (err.cause instanceof Error && !seen.has(err.cause) && depth < MAX_CAUSE_DEPTH) {
      props.cause = _extractErrorProps(err.cause, seen, depth + 1);
    } else if (!(err.cause instanceof Error)) {
      props.cause = err.cause;
    }
  }
  for (const key of Object.keys(err)) {
    if (key === 'cause') continue;
    const value = err[key];
    if (value === null || typeof value !== 'object') {
      props[key] = value;
    } else if (Array.isArray(value) || value instanceof Date) {
      props[key] = value;
    } else if (value instanceof Error) {
      if (!seen.has(value)) {
        props[key] = _extractErrorProps(value, seen, depth);
      }
    } else if (isPlainObject(value)) {
      props[key] = value;
    }
    // Skip class instances (Socket, Agent, ClientRequest, etc.)
  }
  return props;
}

function extractErrorProps(err) {
  return _extractErrorProps(err, new Set(), 0);
}

export default extractErrorProps;
