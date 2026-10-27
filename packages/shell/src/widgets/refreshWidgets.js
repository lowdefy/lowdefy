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

import { getDeviceFeature, hasDeviceFeature } from '@lowdefy/blocks-native/device';

/**
 * Refreshes the Home Screen and Lock Screen widgets from the app's mobile.widgets endpoints: at
 * launch, on resume, on a push with data.refreshWidgets, on background fetch and on RefreshWidgets.
 * A shell without the widgets extension has nothing to refresh.
 */
async function refreshWidgets() {
  if (!hasDeviceFeature('widgets')) {
    return null;
  }
  return getDeviceFeature({ feature: 'widgets', action: 'RefreshWidgets' }).refresh();
}

export default refreshWidgets;
