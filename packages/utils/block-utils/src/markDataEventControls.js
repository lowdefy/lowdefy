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

import { journeyTargetSelectors, type } from '@lowdefy/helpers';

import findDataEventRule from './findDataEventRule.js';

const { controlMarks, dataEventKeyAttribute } = journeyTargetSelectors;

// Marks each data-event element whose event the block's dataEvents lists as a journey control of
// the block: its key is the event name and its row key the element's data-id, so a journey
// targets it as { blockId, control, rowKey } and the recorder writes that target. An event the
// block does not list fires nothing, so its element is no control. Popover content is marked
// too, both where it waits hidden in the HTML (the runner opens the popover that holds a control
// it cannot see) and in the open popover, which shows a copy of it.
function markDataEventControls({ blockId, dataEvents, root }) {
  root.querySelectorAll('[data-event]').forEach((element) => {
    const name = element.getAttribute('data-event');
    if (findDataEventRule({ dataEvents, name }) === null) return;
    const rowKey = element.getAttribute(dataEventKeyAttribute);
    const marks = controlMarks({
      blockId,
      control: name,
      rowKey: type.isNone(rowKey) || rowKey === '' ? null : rowKey,
    });
    Object.entries(marks).forEach(([attribute, value]) => element.setAttribute(attribute, value));
  });
}

export default markDataEventControls;
