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

import { useEffect } from 'react';

// rowLink navigates through the Link action, registered as an internal event (the pattern
// Upload uses for its policy request), so it gets Lowdefy link semantics: router navigation,
// basePath, page input and new tabs.
function useRowLinkEvent(ctx) {
  const { api, config } = ctx;
  const enabled = Boolean(config.rowLink);
  useEffect(() => {
    if (!enabled) return;
    api.methods.registerEvent({
      name: '__rowLink',
      actions: [{ id: '__rowLink', type: 'Link', params: { _event: 'link' } }],
    });
  }, [enabled]);
  return null;
}

export default useRowLinkEvent;
