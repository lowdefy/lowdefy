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

import { type } from '@lowdefy/helpers';

// The recording identity an error entry carries: { source, run, journey } for
// a request or page in a headless journey or explorer run (run and journey
// are the cookie's run.id and run.journey), or null for a developer's own tab
// and for headless tool contexts, whose cookie is 'off'.
function errorRecordingStamp(recording) {
  if (!type.isObject(recording)) {
    return null;
  }
  return {
    source: recording.source,
    run: recording.run.id,
    journey: recording.run.journey,
  };
}

export default errorRecordingStamp;
