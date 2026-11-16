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

// The data sessions this dev server process holds, keyed by session id. On globalThis because the
// journey route that opens a session and the API context that reads it may load as separate module
// instances in one process (Vite's SSR module graph and Node's), like the journey actor token.
const REGISTRY_KEY = Symbol.for('lowdefy.devServer.dataSessions');
globalThis[REGISTRY_KEY] ??= new Map();

const dataSessionRegistry = globalThis[REGISTRY_KEY];

export default dataSessionRegistry;
