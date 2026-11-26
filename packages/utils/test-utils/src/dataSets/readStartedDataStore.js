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

// The key getDataStore keeps the dev server's store under (Symbol.for, so every module instance
// reads the same one).
const STORE_KEY = Symbol.for('lowdefy.devServer.dataStore');

// The dev server's data store if one is started (getDataStore's promise), else null: for work that
// needs the store only when it is already there, such as dropping a stopped journey thread's
// databases, and must not start a mongod to find nothing.
function readStartedDataStore() {
  return globalThis[STORE_KEY] ?? null;
}

export default readStartedDataStore;
