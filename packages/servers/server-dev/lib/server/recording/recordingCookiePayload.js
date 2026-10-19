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

// The recording cookie's payload for a headless context: 'off' when the
// context is a tool looking at a page (screenshots, inspection, operator
// evaluation, state loads), else the run it records as. A run with
// record: false (a journey run its caller does not record) records nothing,
// but its errors still carry its run, so the run claims its own.
function recordingCookiePayload({ recording }) {
  if (type.isUndefined(recording)) {
    return 'off';
  }
  const { source, run } = recording;
  const payload = recording.record === false ? { source, run, record: false } : { source, run };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export default recordingCookiePayload;
