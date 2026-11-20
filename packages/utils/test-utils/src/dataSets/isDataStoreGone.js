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

// The driver's errors for a replica set that is no longer there: mongod exited, or the client was
// closed under it. The store that raised one is dead, so the next journey must start a new one.
const STORE_GONE_ERRORS = new Set([
  'MongoServerSelectionError',
  'MongoTopologyClosedError',
  'MongoNotConnectedError',
]);

function isDataStoreGone(error) {
  return STORE_GONE_ERRORS.has(error?.name);
}

export default isDataStoreGone;
