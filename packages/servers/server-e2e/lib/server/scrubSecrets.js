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

import { createSecretScrubber } from '@lowdefy/node-utils';

import getE2eSecrets from './getE2eSecrets.js';

// E2E logs stay unscrubbed, but _error reads this off the context like every
// other server package, so a thrown message behaves identically in every mode.
const scrubSecrets = createSecretScrubber({ secrets: getE2eSecrets() });

export default scrubSecrets;
