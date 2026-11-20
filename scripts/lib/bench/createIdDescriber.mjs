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

// Describes a build's key and ref ids by what they point at, so two builds that
// number the same config differently describe it the same way.
// describeKey(id): the source file, line and config path, read with resolve,
// the build's own resolveConfigLocation. describeRef(id): the ref's file, line
// and original definition, then its parent's description, up to the root.
function createIdDescriber({ keyMap, refMap, resolve }) {
  // Refs are few and shared by many entries, so each is described once.
  const refDescriptions = new Map();

  function describeKey(id) {
    const location = resolve({ configKey: id, keyMap, refMap });
    if (location === null || location === undefined) {
      return `(key ${id} does not resolve)`;
    }
    return `${location.source} ${location.config}`;
  }

  function describeRef(id) {
    if (refDescriptions.has(id)) {
      return refDescriptions.get(id);
    }
    const entry = refMap[id];
    if (entry === undefined) {
      return `(ref ${id} is not in refMap.json)`;
    }
    // Marks the walk in progress, so a parent cycle ends instead of recursing.
    refDescriptions.set(id, `(ref ${id} is its own ancestor)`);
    const line = entry.lineNumber ? `:${entry.lineNumber}` : '';
    const original = entry.original === undefined ? '' : ` ${JSON.stringify(entry.original)}`;
    const parent =
      entry.parent === null || entry.parent === undefined ? '' : ` < ${describeRef(entry.parent)}`;
    const description = `${entry.path ?? '(no path)'}${line}${original}${parent}`;
    refDescriptions.set(id, description);
    return description;
  }

  return { describeKey, describeRef };
}

export default createIdDescriber;
