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

import buildMonitors from './buildMonitors.js';

// build/monitors.json is always written, as [] when the app declares nothing,
// so a consumer never needs an existence check. The array shape is a contract:
// keep entry ids stable, because a sink keys its monitors on them.
async function writeMonitors({ components, context }) {
  const monitors = buildMonitors({ components, context });
  await context.writeBuildArtifact('monitors.json', JSON.stringify(monitors, null, 2));
}

export default writeMonitors;
