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

import { resolveConfigLocation } from '@lowdefy/errors';

// `file:line`, relative to the config directory, so an alert in any sink points
// at the config that declared the unit. Relative on purpose: the artifact is
// read on a machine that is not the one that built it.
function resolveMonitorSource({ configKey, context }) {
  const location = resolveConfigLocation({
    configKey,
    keyMap: context.keyMap,
    refMap: context.refMap,
  });
  return location?.source ?? null;
}

export default resolveMonitorSource;
