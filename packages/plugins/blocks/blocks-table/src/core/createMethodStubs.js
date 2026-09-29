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

function noop() {
  return undefined;
}

// The stand-in for an optional feature a table does not load: its block methods as no-ops (a
// table without groupable columns has no groups to set, expand or collapse; client data has
// nothing to refresh), so a CallMethod on any declared method succeeds.
function createMethodStubs(entry) {
  return {
    name: entry.name,
    methods: Object.fromEntries(entry.methods.map((method) => [method, () => noop])),
  };
}

export default createMethodStubs;
