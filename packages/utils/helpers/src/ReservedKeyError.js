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

// Keys that are prototype-pollution vectors and are rejected as path segments or map keys.
const RESERVED_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

// True if the string key is a reserved key.
function isReserved(key) {
  return RESERVED_KEYS.has(key);
}

// Thrown by helpers when a path segment or key is a reserved key.
class ReservedKeyError extends Error {
  constructor(segment) {
    super(`Reserved key "${segment}"`);
    // Set on the instance so the name survives extractErrorProps/serializer round-trips.
    this.name = 'ReservedKeyError';
    this.segment = segment;
  }
}

export { RESERVED_KEYS, isReserved, ReservedKeyError };
