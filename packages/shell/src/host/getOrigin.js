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

import { LowdefyInternalError } from '@lowdefy/errors';

// The origin of the app server's URL: its scheme, host and port. checkShellConfig refuses a
// shell.json url that is not absolute, so one reaching here is a Lowdefy wiring bug.
function getOrigin(url) {
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+/i.exec(url);
  if (match === null) {
    throw new LowdefyInternalError(
      `Shell app url is not an absolute URL. Received ${JSON.stringify(url)}.`
    );
  }
  return match[0];
}

export default getOrigin;
