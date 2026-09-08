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

import { listTabs } from './tabChannel.js';

// Shared by inspectState.js and evalOperator.js to decide, when no explicit
// `source` is requested, whether a live browser tab exists to prefer over a
// fresh headless one.
function tabAvailable({ pageId }) {
  return listTabs().some((tab) => type.isNone(pageId) || tab.pageId === pageId);
}

export default tabAvailable;
