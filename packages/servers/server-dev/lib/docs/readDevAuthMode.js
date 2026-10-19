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

import readBuildArtifact from './readBuildArtifact.js';

// Whether the app configures auth, and whether a dev mock user stands in for every caller
// (LOWDEFY_DEV_USER, or auth.dev.mockUser - the precedence getMockUser applies). Read fresh from the
// build, so a journey sees the config as it is now.
function readDevAuthMode() {
  const auth = readBuildArtifact({ name: 'auth.json', deserialize: true }) ?? {};
  return {
    authConfigured: auth.configured === true,
    mockUserActive: Boolean(process.env.LOWDEFY_DEV_USER) || !type.isNone(auth.dev?.mockUser),
  };
}

export default readDevAuthMode;
