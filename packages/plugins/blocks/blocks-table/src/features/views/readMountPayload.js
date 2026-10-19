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

import readPersistedView from './readPersistedView.js';
import sanitizePersistedView from './sanitizePersistedView.js';

// The persisted payload with its view cleaned against the declared columns.
function readMountPayload({ config }) {
  const payload = readPersistedView({ persist: config.persist });
  if (payload === null) return null;
  return {
    view: sanitizePersistedView({
      view: payload.view,
      columnKeys: config.columns.map((column) => column.key),
    }),
    activeView: payload.activeView,
  };
}

export default readMountPayload;
