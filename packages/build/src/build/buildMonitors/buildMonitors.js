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

import collectConnectionMonitors from './collectConnectionMonitors.js';
import collectEndpointMonitors from './collectEndpointMonitors.js';
import collectNotificationMonitors from './collectNotificationMonitors.js';
import collectPageRequestMonitors from './collectPageRequestMonitors.js';
import resolveMonitorDefaults from './resolveMonitorDefaults.js';

// One monitor definition per unit the app declares, over the wide events the
// servers already emit. The framework produces the payload; the operator makes
// the call to their own sink (scripts/monitors/pushAxiom.mjs is the first
// renderer). No per-vendor surface enters the config.
function buildMonitors({ components, context }) {
  const defaults = resolveMonitorDefaults({ components });
  return [
    ...collectEndpointMonitors({ components, context, defaults }),
    ...collectPageRequestMonitors({ components, context, defaults }),
    ...collectNotificationMonitors({ components, context, defaults }),
    ...collectConnectionMonitors({ components, context, defaults }),
  ];
}

export default buildMonitors;
