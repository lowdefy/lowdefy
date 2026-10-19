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

import setUi from './setUi.js';

// A failed run event's message in the table's notice (the run itself shows in the cells).
function showEventError({ api, error }) {
  if (error !== null) setUi({ api, patch: { notice: { type: 'error', message: error } } });
  return error;
}

export default showEventError;
