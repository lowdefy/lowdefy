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

import { journeySequence } from '@lowdefy/node-utils';

// A journey's flow as the `<page> <identity>` lines sequenceId hashes after
// the entry page, written into evidence so the flow can still be matched once
// the steps that made it have been edited away. Click text is read by the
// config text rule, as sequenceId reads it.
function flowLines({ pageId, steps, routeTable, isConfigText }) {
  return journeySequence({ pageId, steps, routeTable, isConfigText }).map(
    ({ page, identity }) => `${page} ${identity}`
  );
}

export default flowLines;
