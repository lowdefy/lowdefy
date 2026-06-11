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

class MakeId {
  constructor() {
    this.counter = 0;
    this.namespace = null;
    this.namespaceCounter = 0;
  }

  next() {
    if (this.namespace !== null) {
      this.namespaceCounter += 1;
      return `${this.namespace}:${this.namespaceCounter.toString(36)}`;
    }
    this.counter += 1;
    return this.counter.toString(36);
  }

  // Per-unit namespaces make keys deterministic and collision-free: JIT page
  // builds use `p:<pageId>` with a counter that resets per build, so
  // rebuilding one page always produces the same keys and never shifts
  // another unit's keys. Skeleton builds keep the global counter (reset per
  // build, deterministic for identical input).
  enterNamespace(namespace) {
    this.namespace = namespace;
    this.namespaceCounter = 0;
  }

  exitNamespace() {
    this.namespace = null;
    this.namespaceCounter = 0;
  }

  reset() {
    this.counter = 0;
    this.namespace = null;
    this.namespaceCounter = 0;
  }

  setCounter(value) {
    this.counter = value;
  }
}

const makeId = new MakeId();

export default makeId;
