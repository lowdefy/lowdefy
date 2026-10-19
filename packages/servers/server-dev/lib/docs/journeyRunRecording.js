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

import { createTraceId, type } from '@lowdefy/helpers';

// The recording identity a journey run's browser contexts carry. A run the
// caller records keeps the identity it was given. Any other run gets one of
// its own that records nothing (record: false), so the errors its pages and
// requests cause are still stamped with its run and claimed by its own error
// buffer, not left in the shared stores. `by` names who started the run.
function journeyRunRecording({ recording, by }) {
  if (!type.isUndefined(recording)) {
    return recording;
  }
  return {
    source: 'journey',
    run: { id: createTraceId(), by: by ?? null, journey: null },
    record: false,
  };
}

export default journeyRunRecording;
