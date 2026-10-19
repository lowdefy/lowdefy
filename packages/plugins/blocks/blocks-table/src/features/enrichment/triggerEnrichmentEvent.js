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

import getEventError from '../editing/getEventError.js';

// Fires an enrichment event and resolves with its failure message, or null when its actions
// succeeded (the same reading of the result as onCellEdit: a failed action chain resolves with
// `success: false`). It never rejects: the engine's event runner resolves even when an action
// fails, but should it ever reject, the caller still gets a message to show and can undo what
// it showed while the event ran (a saving row, a busy overlay).
async function triggerEnrichmentEvent({ api, name, event }) {
  let result;
  try {
    result = await api.methods.triggerEvent({ name, event });
  } catch (error) {
    return getEventError({ success: false, error });
  }
  return getEventError(result);
}

export default triggerEnrichmentEvent;
