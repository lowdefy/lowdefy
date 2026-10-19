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

// onViewSelect fires once the selected view has loaded and committed, after onChange, so its
// actions read the new view from state.
function notifyViewSelect({ cause, api }) {
  if (cause !== 'view' || type.isNone(api.pendingViewSelect)) return;
  const id = api.pendingViewSelect;
  api.pendingViewSelect = null;
  api.methods.triggerEvent({ name: 'onViewSelect', event: { id } });
}

export default notifyViewSelect;
