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

// With config.environments declared the build resolves `schedules` onto every environment
// (schedules.<name>, defaults inherited, plus schedules.default), so an environment run reads its
// own list and a deployment with no current environment reads the default; without environments
// the endpoint carries a plain array.
function getEnvironmentSchedules({ endpointConfig, environment }) {
  const schedules = endpointConfig.schedules;
  if (type.isArray(schedules)) {
    return schedules;
  }
  return schedules?.[environment ?? 'default'] ?? [];
}

export default getEnvironmentSchedules;
